import { toBlob, toPng } from 'html-to-image';

type ShareStage =
  | 'resolve-element'
  | 'build-export-sandbox'
  | 'wait-for-assets'
  | 'render-image'
  | 'open-preview'
  | 'deliver-image'
  | 'cleanup-export-sandbox';

type ShareStageError = Error & {
  stage: ShareStage;
  userMessage: string;
  context?: Record<string, unknown>;
  cause?: unknown;
};

type UnsupportedStyleReport = {
  tagName: string;
  className: string;
  property: string;
  value: string;
};

type PreviewAction = 'cancel' | 'save' | 'share';

let activeShareTask: Promise<boolean> | null = null;
let activePreviewCleanup: (() => void) | null = null;

const EXPORT_SANDBOX_ATTR = 'data-share-export-sandbox';
const PREVIEW_MODAL_ATTR = 'data-share-preview-modal';
const UNSUPPORTED_COLOR_PATTERN = /(oklab|oklch|color\()/i;

const waitForNextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const delay = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints || 0) > 1;

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: typeof error,
    message: String(error),
    stack: undefined,
  };
};

const getUnsupportedStyleSummary = (context: Record<string, unknown>) => {
  const reports = Array.isArray(context.unsupportedStyles)
    ? (context.unsupportedStyles as UnsupportedStyleReport[])
    : [];

  if (!reports.length) {
    return '';
  }

  return reports
    .slice(0, 4)
    .map(
      (item) =>
        `${item.tagName}${item.className ? `.${item.className.replace(/\s+/g, '.')}` : ''}[${item.property}=${item.value}]`
    )
    .join(' | ');
};

const getShareStageMessage = (stage: ShareStage, error?: unknown, context: Record<string, unknown> = {}) => {
  const details = getErrorDetails(error);

  switch (stage) {
    case 'resolve-element':
      return '未找到可导出的分享长图节点，请刷新页面后重试。';
    case 'build-export-sandbox':
      return '分享长图导出环境创建失败，请稍后重试。';
    case 'wait-for-assets':
      return '分享长图资源加载失败，请等待页面加载完成后再试。';
    case 'render-image': {
      const sizeSummary =
        context.exportWidth && context.exportHeight
          ? `尺寸 ${context.exportWidth}x${context.exportHeight}`
          : '尺寸未知';
      const ratioSummary =
        typeof context.pixelRatio === 'number' ? `，像素比 ${context.pixelRatio}` : '';
      const styleSummary = getUnsupportedStyleSummary(context);
      const errorSummary = details.message ? `，原始错误：${details.name}(${details.message})` : `，原始错误：${details.name}`;
      return `长图渲染失败，${sizeSummary}${ratioSummary}${errorSummary}${styleSummary ? `，可疑样式：${styleSummary}` : ''}`;
    }
    case 'open-preview':
      return '图片预览打开失败，请稍后重试。';
    case 'deliver-image':
      return '图片保存或系统分享失败，请检查系统权限后重试。';
    case 'cleanup-export-sandbox':
      return '导出收尾失败，但不影响本次结果。';
    default:
      return '图片导出失败，请稍后重试。';
  }
};

const createShareStageError = (
  stage: ShareStage,
  error: unknown,
  context: Record<string, unknown> = {}
): ShareStageError => {
  const wrapped = new Error(getShareStageMessage(stage, error, context)) as ShareStageError;
  wrapped.name = 'ShareStageError';
  wrapped.stage = stage;
  wrapped.userMessage = getShareStageMessage(stage, error, context);
  wrapped.context = context;
  wrapped.cause = error;
  return wrapped;
};

const logShareStageError = (
  stage: ShareStage,
  error: unknown,
  context: Record<string, unknown> = {}
) => {
  console.error(`[shareAsImage] ${stage} failed`, {
    ...getErrorDetails(error),
    context,
    prompt: getShareStageMessage(stage, error, context),
  });
};

const captureShareStage = async <T>(
  stage: ShareStage,
  action: () => Promise<T> | T,
  context: Record<string, unknown> = {}
) => {
  try {
    return await action();
  } catch (error) {
    logShareStageError(stage, error, context);
    throw createShareStageError(stage, error, context);
  }
};

const getElementMeasurement = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

const cleanupStaleExportSandboxes = () => {
  const staleSandboxes = document.querySelectorAll<HTMLElement | HTMLIFrameElement>(`[${EXPORT_SANDBOX_ATTR}="true"]`);
  staleSandboxes.forEach((node) => node.remove());
  return staleSandboxes.length;
};

const blobFromDataUrl = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const resolveUnsupportedColorToken = (value: string) => {
  if (!value || !UNSUPPORTED_COLOR_PATTERN.test(value)) {
    return value;
  }

  const tokenPattern = /(oklab\([^)]+\)|oklch\([^)]+\)|color\([^)]+\))/gi;

  return value.replace(tokenPattern, (token) => {
    const probe = document.createElement('span');
    probe.style.position = 'fixed';
    probe.style.left = '-99999px';
    probe.style.top = '0';
    probe.style.visibility = 'hidden';

    try {
      probe.style.color = token;
      document.body.appendChild(probe);
      const resolved = window.getComputedStyle(probe).color;
      return resolved && !UNSUPPORTED_COLOR_PATTERN.test(resolved) ? resolved : token;
    } catch {
      return token;
    } finally {
      probe.remove();
    }
  });
};

const copyComputedStyles = (sourceNode: Element, cloneNode: Element) => {
  const computed = window.getComputedStyle(sourceNode);

  if (!(cloneNode instanceof HTMLElement || cloneNode instanceof SVGElement)) {
    return;
  }

  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    if (!property || property.startsWith('--')) {
      continue;
    }

    const rawValue = computed.getPropertyValue(property);
    if (!rawValue) {
      continue;
    }

    const normalizedValue = UNSUPPORTED_COLOR_PATTERN.test(rawValue)
      ? resolveUnsupportedColorToken(rawValue.trim())
      : rawValue;

    cloneNode.style.setProperty(property, normalizedValue, computed.getPropertyPriority(property));
  }

  cloneNode.removeAttribute('class');
};

const syncSpecialNodeState = (sourceNode: Element, cloneNode: Element) => {
  if (sourceNode instanceof HTMLImageElement && cloneNode instanceof HTMLImageElement) {
    cloneNode.src = sourceNode.currentSrc || sourceNode.src;
    cloneNode.srcset = sourceNode.srcset;
    cloneNode.sizes = sourceNode.sizes;
    cloneNode.crossOrigin = sourceNode.crossOrigin || 'anonymous';
    return;
  }

  if (sourceNode instanceof HTMLCanvasElement && cloneNode instanceof HTMLCanvasElement) {
    const context = cloneNode.getContext('2d');
    if (context) {
      cloneNode.width = sourceNode.width;
      cloneNode.height = sourceNode.height;
      context.drawImage(sourceNode, 0, 0);
    }
    return;
  }

  if (sourceNode instanceof HTMLInputElement && cloneNode instanceof HTMLInputElement) {
    cloneNode.value = sourceNode.value;
    cloneNode.checked = sourceNode.checked;
    return;
  }

  if (sourceNode instanceof HTMLTextAreaElement && cloneNode instanceof HTMLTextAreaElement) {
    cloneNode.value = sourceNode.value;
    return;
  }

  if (sourceNode instanceof HTMLSelectElement && cloneNode instanceof HTMLSelectElement) {
    cloneNode.value = sourceNode.value;
  }
};

const getExportDimensions = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);

  const widthCandidates = [
    getElementMeasurement(rect.width),
    getElementMeasurement(element.scrollWidth),
    getElementMeasurement(element.clientWidth),
    getElementMeasurement(element.offsetWidth),
    getElementMeasurement(Number.parseFloat(computedStyle.width || '0')),
  ];
  const heightCandidates = [
    getElementMeasurement(rect.height),
    getElementMeasurement(element.scrollHeight),
    getElementMeasurement(element.clientHeight),
    getElementMeasurement(element.offsetHeight),
    getElementMeasurement(Number.parseFloat(computedStyle.height || '0')),
  ];

  return {
    measuredWidth: widthCandidates.find((value) => value > 0) ?? 0,
    measuredHeight: heightCandidates.find((value) => value > 0) ?? 0,
  };
};

const findUnsupportedStyles = (root: Element, limit = 12) => {
  const reports: UnsupportedStyleReport[] = [];
  const nodes = [root, ...Array.from(root.querySelectorAll('*'))];
  const view = root.ownerDocument.defaultView ?? window;

  for (const node of nodes) {
    if (!(node instanceof view.HTMLElement) && !(node instanceof view.SVGElement)) {
      continue;
    }

    const computed = view.getComputedStyle(node);
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      if (!property || property.startsWith('--')) {
        continue;
      }

      const value = computed.getPropertyValue(property).trim();
      if (!value || !UNSUPPORTED_COLOR_PATTERN.test(value)) {
        continue;
      }

      reports.push({
        tagName: node.tagName.toLowerCase(),
        className: node.getAttribute('class') || '',
        property,
        value,
      });

      if (reports.length >= limit) {
        return reports;
      }
    }
  }

  return reports;
};

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const finalize = () => {
            img.removeEventListener('load', finalize);
            img.removeEventListener('error', finalize);
            resolve();
          };

          img.addEventListener('load', finalize, { once: true });
          img.addEventListener('error', finalize, { once: true });
        })
    )
  );
};

const waitForExportReady = async (root: HTMLElement) => {
  try {
    if (root.ownerDocument.fonts?.ready) {
      await root.ownerDocument.fonts.ready;
    }
  } catch (error) {
    console.warn('Font readiness check failed:', error);
  }

  await waitForImages(root);
  await waitForNextFrame();
  await waitForNextFrame();
};

const getSafePixelRatio = (exportWidth: number, exportHeight: number) => {
  const area = Math.max(exportWidth, 1) * Math.max(exportHeight, 1);
  const baseRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1.15), 1.5);

  if (area > 12_000_000) {
    return 0.9;
  }

  if (area > 8_000_000) {
    return 1;
  }

  if (area > 5_000_000) {
    return Math.max(1.05, baseRatio - 0.2);
  }

  return baseRatio;
};

const renderNodeToBlobWithRetry = async ({
  exportNode,
  pixelRatio,
}: {
  exportNode: HTMLElement;
  pixelRatio: number;
}) => {
  const attempts = [pixelRatio, Math.max(1, pixelRatio - 0.15), 0.9];
  let lastError: unknown;

  for (const ratio of attempts) {
    try {
      const blob = await toBlob(exportNode, {
        cacheBust: true,
        backgroundColor: '#f4f1ea',
        pixelRatio: ratio,
      });

      if (blob) {
        return blob;
      }

      const dataUrl = await toPng(exportNode, {
        cacheBust: true,
        backgroundColor: '#f4f1ea',
        pixelRatio: ratio,
      });

      return blobFromDataUrl(dataUrl);
    } catch (error) {
      lastError = error;
      console.warn(`html-to-image export attempt failed at pixelRatio=${ratio}:`, error);
      await delay(120);
    }
  }

  throw lastError ?? new Error('Failed to render export image');
};

const createExportSandbox = (sourceElement: HTMLElement) => {
  const staleSandboxCount = cleanupStaleExportSandboxes();
  const { measuredWidth, measuredHeight } = getExportDimensions(sourceElement);
  const exportWidth = Math.max(Math.ceil(measuredWidth || 0), 960);

  const iframe = document.createElement('iframe');
  iframe.setAttribute(EXPORT_SANDBOX_ATTR, 'true');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-100000px';
  iframe.style.top = '0';
  iframe.style.width = `${exportWidth + 64}px`;
  iframe.style.height = `${Math.max(Math.ceil(measuredHeight || sourceElement.scrollHeight || 1200) + 96, 1400)}px`;
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    throw new Error('Failed to access export iframe document');
  }

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0;background:#f4f1ea;"></body></html>`);
  doc.close();

  const wrapper = doc.createElement('div');
  wrapper.style.background = '#f4f1ea';
  wrapper.style.padding = '32px';
  wrapper.style.width = `${exportWidth + 64}px`;
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.overflow = 'hidden';

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  const sourceNodes = [sourceElement, ...Array.from(sourceElement.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];

  clone.style.width = `${exportWidth}px`;
  clone.style.maxWidth = 'none';
  clone.style.minWidth = `${exportWidth}px`;
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.animation = 'none';
  clone.style.transition = 'none';

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index];
    if (!cloneNode) {
      return;
    }

    copyComputedStyles(sourceNode, cloneNode);
    syncSpecialNodeState(sourceNode, cloneNode);

    if (!(sourceNode instanceof HTMLElement) || !(cloneNode instanceof HTMLElement)) {
      return;
    }

    const computed = window.getComputedStyle(sourceNode);
    const isScrollable =
      sourceNode.scrollHeight > sourceNode.clientHeight ||
      sourceNode.scrollWidth > sourceNode.clientWidth ||
      /(auto|scroll)/.test(computed.overflow) ||
      /(auto|scroll)/.test(computed.overflowY) ||
      /(auto|scroll)/.test(computed.overflowX);

    cloneNode.style.transform = 'none';
    cloneNode.style.animation = 'none';
    cloneNode.style.transition = 'none';

    if (isScrollable) {
      cloneNode.style.overflow = 'visible';
      cloneNode.style.overflowX = 'visible';
      cloneNode.style.overflowY = 'visible';
      cloneNode.style.maxHeight = 'none';
      cloneNode.style.height = 'auto';
    }

    if (sourceNode.scrollHeight > sourceNode.clientHeight) {
      cloneNode.style.height = `${sourceNode.scrollHeight}px`;
    }

    if (sourceNode.scrollWidth > sourceNode.clientWidth) {
      cloneNode.style.width = `${sourceNode.scrollWidth}px`;
      cloneNode.style.maxWidth = 'none';
    }
  });

  wrapper.appendChild(clone);
  doc.body.appendChild(wrapper);

  return {
    exportNode: wrapper,
    metrics: {
      exportWidth,
      exportHeight: Math.max(wrapper.scrollHeight, clone.scrollHeight, Math.ceil(measuredHeight || 0)),
      staleSandboxCount,
      unsupportedStyles: findUnsupportedStyles(wrapper),
    },
    cleanup: () => iframe.remove(),
  };
};

const canShareFile = (file: File) => {
  if (!navigator.share) {
    return false;
  }

  if (!navigator.canShare) {
    return true;
  }

  try {
    return navigator.canShare({ files: [file] });
  } catch (error) {
    console.warn('navigator.canShare failed:', error);
    return false;
  }
};

const downloadBlob = (objectUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const revokeObjectUrlLater = (objectUrl: string, delayMs = 1500) => {
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, delayMs);
};

const cleanupActivePreviewModal = () => {
  if (activePreviewCleanup) {
    activePreviewCleanup();
    return;
  }

  document.querySelectorAll(`[${PREVIEW_MODAL_ATTR}="true"]`).forEach((node) => node.remove());
};

const applyPreviewButtonStyles = (
  button: HTMLButtonElement,
  variant: 'primary' | 'secondary' | 'ghost'
) => {
  button.type = 'button';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.minHeight = '46px';
  button.style.padding = '0 18px';
  button.style.borderRadius = '999px';
  button.style.fontSize = '15px';
  button.style.fontWeight = '600';
  button.style.cursor = 'pointer';
  button.style.transition = 'transform 0.18s ease, opacity 0.18s ease, background-color 0.18s ease';

  if (variant === 'primary') {
    button.style.border = '0';
    button.style.background = '#111827';
    button.style.color = '#f9fafb';
    return;
  }

  if (variant === 'secondary') {
    button.style.border = '1px solid rgba(17, 24, 39, 0.12)';
    button.style.background = '#ffffff';
    button.style.color = '#111827';
    return;
  }

  button.style.border = '1px solid rgba(17, 24, 39, 0.08)';
  button.style.background = 'transparent';
  button.style.color = '#4b5563';
};

const createPreviewController = ({
  objectUrl,
  fileName,
  supportsSystemShare,
}: {
  objectUrl: string;
  fileName: string;
  supportsSystemShare: boolean;
}) => {
  cleanupActivePreviewModal();

  const previousBodyOverflow = document.body.style.overflow;
  const overlay = document.createElement('div');
  overlay.setAttribute(PREVIEW_MODAL_ATTR, 'true');
  overlay.setAttribute('role', 'presentation');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '16px';
  overlay.style.background = 'rgba(15, 23, 42, 0.72)';
  overlay.style.backdropFilter = 'blur(8px)';

  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', '长图预览');
  dialog.style.width = '100%';
  dialog.style.maxWidth = isMobileDevice() ? '440px' : '720px';
  dialog.style.maxHeight = '92vh';
  dialog.style.display = 'flex';
  dialog.style.flexDirection = 'column';
  dialog.style.background = '#f8f4ec';
  dialog.style.borderRadius = '28px';
  dialog.style.boxShadow = '0 24px 80px rgba(15, 23, 42, 0.28)';
  dialog.style.overflow = 'hidden';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'flex-start';
  header.style.justifyContent = 'space-between';
  header.style.gap = '16px';
  header.style.padding = '20px 20px 14px';

  const titleWrap = document.createElement('div');
  titleWrap.style.minWidth = '0';

  const title = document.createElement('div');
  title.textContent = '长图预览';
  title.style.fontSize = '18px';
  title.style.fontWeight = '700';
  title.style.color = '#111827';

  const subtitle = document.createElement('div');
  subtitle.textContent = supportsSystemShare && isMobileDevice()
    ? '确认内容后可继续保存到相册或调用系统分享。'
    : '确认内容后可继续保存图片。';
  subtitle.style.marginTop = '6px';
  subtitle.style.fontSize = '13px';
  subtitle.style.lineHeight = '1.5';
  subtitle.style.color = '#6b7280';

  const fileLabel = document.createElement('div');
  fileLabel.textContent = fileName;
  fileLabel.style.marginTop = '4px';
  fileLabel.style.fontSize = '12px';
  fileLabel.style.color = '#9ca3af';
  fileLabel.style.wordBreak = 'break-all';

  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  titleWrap.appendChild(fileLabel);

  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  applyPreviewButtonStyles(closeButton, 'ghost');
  closeButton.style.flexShrink = '0';

  header.appendChild(titleWrap);
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.style.flex = '1';
  body.style.minHeight = '0';
  body.style.overflow = 'auto';
  body.style.padding = '0 20px 18px';

  const previewFrame = document.createElement('div');
  previewFrame.style.background = '#efe7dc';
  previewFrame.style.borderRadius = '24px';
  previewFrame.style.padding = '12px';
  previewFrame.style.boxSizing = 'border-box';

  const previewImage = document.createElement('img');
  previewImage.src = objectUrl;
  previewImage.alt = '分享长图预览';
  previewImage.decoding = 'async';
  previewImage.style.display = 'block';
  previewImage.style.width = '100%';
  previewImage.style.height = 'auto';
  previewImage.style.borderRadius = '24px';
  previewImage.style.background = '#ffffff';

  previewFrame.appendChild(previewImage);
  body.appendChild(previewFrame);

  const footer = document.createElement('div');
  footer.style.display = 'grid';
  footer.style.gridTemplateColumns = supportsSystemShare ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))';
  footer.style.gap = '12px';
  footer.style.padding = '16px 20px 20px';
  footer.style.borderTop = '1px solid rgba(17, 24, 39, 0.08)';
  footer.style.background = 'rgba(255, 255, 255, 0.72)';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  applyPreviewButtonStyles(cancelButton, 'ghost');

  const saveButton = document.createElement('button');
  saveButton.textContent = '保存图片';
  applyPreviewButtonStyles(saveButton, 'primary');

  footer.appendChild(cancelButton);
  footer.appendChild(saveButton);

  let shareButton: HTMLButtonElement | null = null;
  if (supportsSystemShare) {
    shareButton = document.createElement('button');
    shareButton.textContent = '系统分享';
    applyPreviewButtonStyles(shareButton, 'secondary');
    footer.appendChild(shareButton);
  }

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);

  let resolved = false;
  let resolveAction: ((action: PreviewAction) => void) | null = null;

  const cleanup = () => {
    if (activePreviewCleanup === cleanup) {
      activePreviewCleanup = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    document.body.style.overflow = previousBodyOverflow;
  };

  const finalize = (action: PreviewAction) => {
    if (resolved) {
      return;
    }
    resolved = true;
    cleanup();
    resolveAction?.(action);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      finalize('cancel');
    }
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      finalize('cancel');
    }
  });
  closeButton.addEventListener('click', () => finalize('cancel'));
  cancelButton.addEventListener('click', () => finalize('cancel'));
  saveButton.addEventListener('click', () => finalize('save'));
  shareButton?.addEventListener('click', () => finalize('share'));

  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeyDown);
  document.body.appendChild(overlay);
  activePreviewCleanup = cleanup;

  previewImage.decode?.().catch(() => undefined);
  closeButton.focus();

  return {
    waitForAction: new Promise<PreviewAction>((resolve) => {
      resolveAction = resolve;
    }),
    cleanup,
  };
};

const handleShareAbort = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
};

const deliverImageAction = async ({
  action,
  file,
  objectUrl,
  supportsSystemShare,
}: {
  action: PreviewAction;
  file: File;
  objectUrl: string;
  supportsSystemShare: boolean;
}) => {
  if (action === 'cancel') {
    return false;
  }

  if (action === 'share') {
    if (!supportsSystemShare) {
      throw new Error('System share is not supported for this image');
    }

    try {
      await navigator.share({
        title: '分享图片',
        text: '分享这张图片',
        files: [file],
      });
      return true;
    } catch (error) {
      if (handleShareAbort(error)) {
        return false;
      }
      throw error;
    }
  }

  if (isMobileDevice() && supportsSystemShare) {
    try {
      await navigator.share({
        title: '保存图片',
        text: '请在系统面板中选择“保存图片”或“添加到相册”。',
        files: [file],
      });
      return true;
    } catch (error) {
      if (handleShareAbort(error)) {
        return false;
      }
      throw error;
    }
  }

  downloadBlob(objectUrl, file.name);
  await delay(150);
  return true;
};

export const shareAsImage = async (elementId: string, fileName = 'result.png') => {
  if (activeShareTask) {
    return activeShareTask;
  }

  const runShareTask = async () => {
    const element = await captureShareStage(
      'resolve-element',
      () => document.getElementById(elementId),
      { elementId, fileName }
    );

    if (!element) {
      throw createShareStageError(
        'resolve-element',
        new Error(`Element with id ${elementId} not found`),
        { elementId, fileName }
      );
    }

    const { exportNode, metrics, cleanup } = await captureShareStage(
      'build-export-sandbox',
      () => createExportSandbox(element),
      {
        elementId,
        fileName,
        elementWidth: element.clientWidth,
        elementHeight: element.clientHeight,
      }
    );

    try {
      const pixelRatio = getSafePixelRatio(metrics.exportWidth, metrics.exportHeight);

      await captureShareStage(
        'wait-for-assets',
        () => waitForExportReady(exportNode),
        {
          elementId,
          fileName,
          exportWidth: metrics.exportWidth,
          exportHeight: metrics.exportHeight,
        }
      );

      const blob = await captureShareStage(
        'render-image',
        () =>
          renderNodeToBlobWithRetry({
            exportNode,
            pixelRatio,
          }),
        {
          elementId,
          fileName,
          exportWidth: metrics.exportWidth,
          exportHeight: metrics.exportHeight,
          pixelRatio,
          staleSandboxCount: metrics.staleSandboxCount,
          unsupportedStyles: metrics.unsupportedStyles,
        }
      );

      const file = new File([blob], fileName, { type: 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      try {
        const supportsSystemShare = canShareFile(file);
        const previewController = await captureShareStage(
          'open-preview',
          () =>
            createPreviewController({
              objectUrl,
              fileName,
              supportsSystemShare,
            }),
          {
            elementId,
            fileName,
            blobSize: blob.size,
            blobType: blob.type,
            supportsSystemShare,
          }
        );

        try {
          const deliveryContext: Record<string, unknown> = {
            elementId,
            fileName,
            blobSize: blob.size,
            blobType: blob.type,
            supportsSystemShare,
          };

          return await captureShareStage(
            'deliver-image',
            async () => {
              const action = await previewController.waitForAction;
              deliveryContext.previewAction = action;
              return deliverImageAction({
                action,
                file,
                objectUrl,
                supportsSystemShare,
              });
            },
            deliveryContext
          );
        } finally {
          previewController.cleanup();
        }
      } finally {
        revokeObjectUrlLater(objectUrl);
      }
    } finally {
      try {
        cleanup();
      } catch (cleanupError) {
        logShareStageError('cleanup-export-sandbox', cleanupError, {
          elementId,
          fileName,
        });
      }
    }
  };

  activeShareTask = runShareTask()
    .catch((error) => {
      const preciseMessage =
        error instanceof Error && 'userMessage' in error
          ? (error as ShareStageError).userMessage
          : '图片导出失败，请稍后重试。';
      console.error('Failed to export share image:', error);
      alert(preciseMessage);
      return false;
    })
    .finally(() => {
      activeShareTask = null;
    });

  return activeShareTask;
};
