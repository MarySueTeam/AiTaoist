import { Solar } from 'lunar-javascript';

const Type = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
};

const DISALLOWED_PAYLOAD_KEYS = new Set([
  'input',
  'instructions',
  'systemInstruction',
  'responseSchema',
  'schema',
  'text',
  'tools',
  'messages',
  'contents',
]);

const RELATIONSHIP_PROMPTS = {
  intimate:
    '本次关系类型：亲密关系。请重点分析情感连接、亲密吸引、承诺稳定性、长期相处、伴侣议题与现实磨合。',
  friendship:
    '本次关系类型：友情。请重点分析朋友缘分、信任基础、价值观互补、日常支持、边界感与容易产生误会的相处点。',
  cooperation:
    '本次关系类型：合作。请重点分析协作默契、资源互补、决策节奏、权责边界、利益分配与长期合作风险。',
};

const SIMPLE_KIND_KEYS = {
  basicFortune: ['gender', 'birthDate', 'birthTime', 'toneMode'],
  luren: ['question', 'date', 'time', 'toneMode'],
  xiaoluren: ['question', 'date', 'time', 'toneMode'],
  liuyao: ['question', 'date', 'time', 'toneMode', 'method', 'tosses'],
  dailyFortune: ['gender', 'birthDate', 'birthTime', 'targetDate'],
  compatibility: [
    'gender1',
    'birthDate1',
    'birthTime1',
    'gender2',
    'birthDate2',
    'birthTime2',
    'toneMode',
    'relationship',
  ],
  dayunBatch: [
    'gender',
    'birthDate',
    'birthTime',
    'exactBazi',
    'skeleton',
    'toneMode',
    'includeLiunian',
  ],
};

function normalizeSchema(schema) {
  if (schema.type === Type.OBJECT) {
    const properties = Object.fromEntries(
      Object.entries(schema.properties || {}).map(([key, value]) => [key, normalizeSchema(value)])
    );

    return {
      ...schema,
      properties,
      additionalProperties: false,
    };
  }

  if (schema.type === Type.ARRAY && schema.items) {
    return {
      ...schema,
      items: normalizeSchema(schema.items),
    };
  }

  return schema;
}

function getTonePrompt(toneMode = 'default') {
  if (toneMode === 'harsh') {
    return '【毒舌模式开启】：你的语言必须极其直白、尖锐、一针见血，不要任何委婉和安慰。';
  }

  if (toneMode === 'sweet') {
    return '【甜嘴模式开启】：请尽量多讲优势、转机与值得期待之处，即使指出问题也要用温和鼓励的方式表达，避免刻薄打击。';
  }

  return '请用道家专业且慈悲的口吻进行解答。';
}

function ensureObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}必须是对象。`);
  }
}

function ensureString(value, label, maxLength = 200) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label}不能为空。`);
  }

  if (value.length > maxLength) {
    throw new Error(`${label}过长。`);
  }
}

function ensureDate(value, label) {
  ensureString(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label}格式不正确。`);
  }
}

function ensureTime(value, label) {
  ensureString(value, label, 5);
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${label}格式不正确。`);
  }
}

function ensureToneMode(value) {
  if (value === undefined) return;
  if (!['default', 'harsh', 'sweet'].includes(value)) {
    throw new Error('语气模式不支持。');
  }
}

function rejectDisallowedPayload(payload) {
  for (const key of Object.keys(payload)) {
    if (DISALLOWED_PAYLOAD_KEYS.has(key)) {
      throw new Error(`包含不允许的字段：${key}`);
    }
  }
}

function rejectUnknownPayloadKeys(kind, payload) {
  const allowed = new Set(SIMPLE_KIND_KEYS[kind] || []);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) {
      throw new Error(`包含不允许的字段：${key}`);
    }
  }
}

function getExactBazi(birthDate, birthTime) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  return `${lunar.getEightChar().getYear()} ${lunar.getEightChar().getMonth()} ${lunar.getEightChar().getDay()} ${lunar.getEightChar().getTime()}`;
}

function validateCommonBirthPayload(payload) {
  ensureString(payload.gender, '性别', 2);
  ensureDate(payload.birthDate, '出生日期');
  ensureTime(payload.birthTime, '出生时间');
  ensureToneMode(payload.toneMode);
}

function validateQuestionPayload(payload) {
  ensureString(payload.question, '所问之事', 200);
  ensureDate(payload.date, '日期');
  ensureTime(payload.time, '时间');
  ensureToneMode(payload.toneMode);
}

function validateSkeleton(skeleton) {
  if (!Array.isArray(skeleton) || skeleton.length < 1 || skeleton.length > 8) {
    throw new Error('大运骨架不正确。');
  }

  for (const phase of skeleton) {
    ensureObject(phase, '大运骨架');
    ensureString(phase.period, '大运阶段', 80);
    ensureString(phase.ganzhi, '大运干支', 10);
    if (phase.liunian !== undefined && !Array.isArray(phase.liunian)) {
      throw new Error('流年骨架不正确。');
    }
  }
}

export function validateFortunePayload(body) {
  ensureObject(body, '请求体');
  const { kind, payload = {} } = body;
  ensureString(kind, '测算类型', 40);

  if (!Object.prototype.hasOwnProperty.call(SIMPLE_KIND_KEYS, kind)) {
    throw new Error('不支持的测算类型。');
  }

  ensureObject(payload, '业务参数');
  rejectDisallowedPayload(payload);
  rejectUnknownPayloadKeys(kind, payload);

  if (kind === 'basicFortune') {
    validateCommonBirthPayload(payload);
  } else if (kind === 'compatibility') {
    ensureString(payload.gender1, '主测人性别', 2);
    ensureDate(payload.birthDate1, '主测人出生日期');
    ensureTime(payload.birthTime1, '主测人出生时间');
    ensureString(payload.gender2, '合测人性别', 2);
    ensureDate(payload.birthDate2, '合测人出生日期');
    ensureTime(payload.birthTime2, '合测人出生时间');
    ensureToneMode(payload.toneMode);
    if (payload.relationship !== undefined && !RELATIONSHIP_PROMPTS[payload.relationship]) {
      throw new Error('关系类型不支持。');
    }
  } else if (kind === 'luren' || kind === 'xiaoluren') {
    validateQuestionPayload(payload);
  } else if (kind === 'liuyao') {
    validateQuestionPayload(payload);
    if (payload.method !== undefined && !['time', 'coin'].includes(payload.method)) {
      throw new Error('起卦方式不支持。');
    }
    if (payload.tosses !== undefined) {
      if (!Array.isArray(payload.tosses) || payload.tosses.length !== 6) {
        throw new Error('铜钱摇卦结果不正确。');
      }
      payload.tosses.forEach((value) => {
        if (![6, 7, 8, 9].includes(value)) {
          throw new Error('铜钱摇卦结果不正确。');
        }
      });
    }
  } else if (kind === 'dailyFortune') {
    validateCommonBirthPayload(payload);
    ensureDate(payload.targetDate, '目标日期');
  } else if (kind === 'dayunBatch') {
    validateCommonBirthPayload(payload);
    ensureString(payload.exactBazi, '八字', 40);
    validateSkeleton(payload.skeleton);
    ensureToneMode(payload.toneMode);
  }

  return body;
}

function basicSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      yongshen: {
        type: Type.OBJECT,
        properties: { xi: { type: Type.STRING }, ji: { type: Type.STRING }, yong: { type: Type.STRING } },
        required: ['xi', 'ji', 'yong'],
      },
      wuxingRatio: {
        type: Type.OBJECT,
        properties: {
          metal: { type: Type.NUMBER },
          wood: { type: Type.NUMBER },
          water: { type: Type.NUMBER },
          fire: { type: Type.NUMBER },
          earth: { type: Type.NUMBER },
        },
        required: ['metal', 'wood', 'water', 'fire', 'earth'],
      },
      wuxing: { type: Type.STRING },
      overall: { type: Type.STRING },
      health: { type: Type.STRING },
      character: { type: Type.STRING },
      wealthSummary: { type: Type.STRING },
      careerSummary: { type: Type.STRING },
      emotionSummary: { type: Type.STRING },
      familySummary: { type: Type.STRING },
    },
    required: [
      'yongshen',
      'wuxingRatio',
      'wuxing',
      'overall',
      'health',
      'character',
      'wealthSummary',
      'careerSummary',
      'emotionSummary',
      'familySummary',
    ],
  };
}

function dayunSchema(includeLiunian) {
  const liunianItem = {
    type: Type.OBJECT,
    properties: {
      year: { type: Type.INTEGER },
      age: { type: Type.INTEGER },
      ganzhi: { type: Type.STRING },
      score: { type: Type.INTEGER },
      wealthScore: { type: Type.INTEGER },
      emotionScore: { type: Type.INTEGER },
      healthScore: { type: Type.INTEGER },
      careerScore: { type: Type.INTEGER },
      familyScore: { type: Type.INTEGER },
      description: { type: Type.STRING },
      wuxingPreference: { type: Type.STRING },
      wealthDescription: { type: Type.STRING },
      emotionDescription: { type: Type.STRING },
      careerDescription: { type: Type.STRING },
      familyDescription: { type: Type.STRING },
      healthDescription: { type: Type.STRING },
    },
    required: [
      'year',
      'age',
      'ganzhi',
      'score',
      'wealthScore',
      'emotionScore',
      'healthScore',
      'careerScore',
      'familyScore',
      'description',
      'wuxingPreference',
      'wealthDescription',
      'emotionDescription',
      'careerDescription',
      'familyDescription',
      'healthDescription',
    ],
  };

  const properties = {
    period: { type: Type.STRING },
    ganzhi: { type: Type.STRING },
    description: { type: Type.STRING },
    wuxingPreference: { type: Type.STRING },
    wealthDescription: { type: Type.STRING },
    emotionDescription: { type: Type.STRING },
    careerDescription: { type: Type.STRING },
    familyDescription: { type: Type.STRING },
    healthDescription: { type: Type.STRING },
    score: { type: Type.INTEGER },
    wealthScore: { type: Type.INTEGER },
    emotionScore: { type: Type.INTEGER },
    healthScore: { type: Type.INTEGER },
    careerScore: { type: Type.INTEGER },
    familyScore: { type: Type.INTEGER },
  };
  const required = Object.keys(properties);

  if (includeLiunian) {
    properties.liunian = { type: Type.ARRAY, items: liunianItem };
    required.push('liunian');
  }

  return {
    type: Type.OBJECT,
    properties: {
      dayun: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT, properties, required },
      },
    },
    required: ['dayun'],
  };
}

const SIMPLE_SCHEMAS = {
  luren: {
    type: Type.OBJECT,
    properties: {
      sike: { type: Type.ARRAY, items: { type: Type.STRING } },
      sanchuan: { type: Type.ARRAY, items: { type: Type.STRING } },
      tianpan: { type: Type.STRING },
      overall: { type: Type.STRING },
      advice: { type: Type.STRING },
    },
    required: ['sike', 'sanchuan', 'tianpan', 'overall', 'advice'],
  },
  xiaoluren: {
    type: Type.OBJECT,
    properties: {
      gongwei: { type: Type.ARRAY, items: { type: Type.STRING } },
      overall: { type: Type.STRING },
      advice: { type: Type.STRING },
    },
    required: ['gongwei', 'overall', 'advice'],
  },
  liuyao: {
    type: Type.OBJECT,
    properties: {
      bengua: { type: Type.STRING },
      biangua: { type: Type.STRING },
      benguaLines: { type: Type.ARRAY, items: { type: Type.STRING } },
      bianguaLines: { type: Type.ARRAY, items: { type: Type.STRING } },
      shiying: { type: Type.STRING },
      yongshen: { type: Type.STRING },
      liuqin: { type: Type.STRING },
      yaoci: { type: Type.ARRAY, items: { type: Type.STRING } },
      overall: { type: Type.STRING },
      detailedAnalysis: { type: Type.STRING },
      advice: { type: Type.STRING },
    },
    required: [
      'bengua',
      'biangua',
      'benguaLines',
      'bianguaLines',
      'shiying',
      'yongshen',
      'liuqin',
      'yaoci',
      'overall',
      'detailedAnalysis',
      'advice',
    ],
  },
  dailyFortune: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING },
      period: {
        type: Type.OBJECT,
        properties: {
          dayun: { type: Type.STRING },
          liunian: { type: Type.STRING },
          liuyue: { type: Type.STRING },
          liuri: { type: Type.STRING },
        },
        required: ['dayun', 'liunian', 'liuyue', 'liuri'],
      },
      score: { type: Type.NUMBER },
      summary: { type: Type.STRING },
      auspicious: { type: Type.STRING },
      inauspicious: { type: Type.STRING },
      shensha: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
          required: ['name', 'description'],
        },
      },
    },
    required: ['date', 'period', 'score', 'summary', 'auspicious', 'inauspicious', 'shensha'],
  },
  compatibility: {
    type: Type.OBJECT,
    properties: {
      person1Bazi: { type: Type.STRING },
      person2Bazi: { type: Type.STRING },
      overallScore: { type: Type.NUMBER },
      emotionAnalysis: { type: Type.STRING },
      interactionPattern: { type: Type.STRING },
      futureDirection: { type: Type.STRING },
      suggestions: { type: Type.STRING },
    },
    required: [
      'person1Bazi',
      'person2Bazi',
      'overallScore',
      'emotionAnalysis',
      'interactionPattern',
      'futureDirection',
      'suggestions',
    ],
  },
};

function buildBasicRequest(payload) {
  const harshPrompt = getTonePrompt(payload.toneMode);
  const exactBazi = getExactBazi(payload.birthDate, payload.birthTime);
  const input = `
你是一个深耕中国传统命理的道士，精通八字。请根据以下求测者的出生信息，进行八字排盘，并给出详细的命理测算结果。
${harshPrompt}

求测者信息：
性别：${payload.gender}
出生日期（公历）：${payload.birthDate}
出生时间：${payload.birthTime}
准确四柱八字：${exactBazi}

【推演要求】：
1. 必须基于给定准确八字推演，不得擅自改动四柱。
2. 藏干与神煞展示由系统按固定规则计算，你不要返回四柱、藏干、神煞明细，也不要自行补排。
3. 先定旺衰、格局、调候、喜忌与用神，再展开整体命格、健康、性格、财运、事业、情感与家庭。
4. 神煞只作辅助，不得推翻五行生克、旺衰、格局与调候主判断。
5. 总运内容不要出现具体年份、具体年龄或某年某岁事件。
6. 请严格按照 JSON schema 返回结果。`;

  return {
    instructions:
      '你是一个深耕中国传统命理的道士，精通八字。必须以给定八字为准，输出结构化命理论断。',
    input,
    schema: basicSchema(),
  };
}

function buildDayunRequest(payload) {
  const includeLiunian = payload.includeLiunian !== false;
  const skeletonJson = JSON.stringify(payload.skeleton, null, 2);
  const input = `
你是一个深耕中国传统命理的道士，精通八字大运流年推演。
${getTonePrompt(payload.toneMode)}

求测者信息：
性别：${payload.gender}
出生日期：${payload.birthDate} ${payload.birthTime}
八字：${payload.exactBazi}

【推演要求】：
1. 以“格局为纲、用神为核、调候为先、岁运互动为用”为核心。
2. 大运和流年只以五行生克制化、十神、刑冲合害为主要依据。
3. 必须完整保留输入骨架中的全部大运${includeLiunian ? '与流年' : ''}，不得遗漏、合并或改写顺序。
4. 每条描述至少 30 个字，评分必须和分析一致。

传入骨架：
${skeletonJson}

请严格按照 JSON schema 返回结果。`;

  return {
    instructions:
      '你是一个深耕中国传统命理的道士，精通八字大运流年推演。必须完整保留输入骨架并填充结构化分析。',
    input,
    schema: dayunSchema(includeLiunian),
  };
}

function buildQuestionRequest(kind, payload) {
  const kindLabel = kind === 'luren' ? '大六壬' : kind === 'xiaoluren' ? '小六壬' : '六爻八卦';
  const extra =
    kind === 'liuyao'
      ? `\n起卦方式：${payload.method === 'coin' ? `铜钱摇卦，结果为 ${JSON.stringify(payload.tosses || [])}` : '时间起卦'}`
      : '';
  const input = `
你是一个深耕中国传统命理的道士，精通${kindLabel}。请根据以下起卦信息与所问之事进行推演。
${getTonePrompt(payload.toneMode)}

起卦信息：
所问之事：${payload.question}
起卦日期（公历）：${payload.date}
起卦时间：${payload.time}${extra}

【推演要求】：
1. 先排盘或定象，再说明关键作用逻辑，最后落到结论与建议。
2. 结论必须紧扣起卦结构，不要给空泛套话。
3. 请严格按照 JSON schema 返回结果。`;

  return {
    instructions: `你是一个深耕中国传统命理的道士，精通${kindLabel}，擅长结构化断事。`,
    input,
    schema: SIMPLE_SCHEMAS[kind],
  };
}

function buildDailyRequest(payload) {
  const exactBazi = getExactBazi(payload.birthDate, payload.birthTime);
  const input = `
你是一个深耕中国传统命理的道士。请根据求测者的八字，结合目标日期（流日），给出当天的运势简报。

求测者信息：
性别：${payload.gender}
出生日期：${payload.birthDate} ${payload.birthTime}
准确八字：${exactBazi}
目标查询日期（公历）：${payload.targetDate}

【推演要求】：
1. 先看原局喜忌，再看大运、流年、流月、流日层层作用。
2. score 必须与干支对原局喜忌、冲合刑害、扶抑得失保持一致。
3. auspicious 与 inauspicious 要具体到行为倾向或注意事项。
4. 请严格按照 JSON schema 返回结果。`;

  return {
    instructions:
      '你是一个深耕中国传统命理的道士，擅长每日运势推演。判断必须有依据，输出结构化简报。',
    input,
    schema: SIMPLE_SCHEMAS.dailyFortune,
  };
}

function buildCompatibilityRequest(payload) {
  const exactBazi1 = getExactBazi(payload.birthDate1, payload.birthTime1);
  const exactBazi2 = getExactBazi(payload.birthDate2, payload.birthTime2);
  const relationshipPrompt = RELATIONSHIP_PROMPTS[payload.relationship || 'intimate'];
  const input = `
你是一个深耕中国传统命理的道士，精通八字关系合盘。请根据以下两人的八字信息进行详细合盘推演。
${getTonePrompt(payload.toneMode)}
${relationshipPrompt}

第一方（主测人）：
性别：${payload.gender1}
出生日期：${payload.birthDate1} ${payload.birthTime1}
准确八字：${exactBazi1}

第二方（合测人）：
性别：${payload.gender2}
出生日期：${payload.birthDate2} ${payload.birthTime2}
准确八字：${exactBazi2}

【推演要求】：
1. 以生克合冲、五行互补、双方原局喜忌为基础。
2. 若为亲密关系，再参考配偶星与配偶宫；若为友情或合作，不要强行套用婚恋断语。
3. overallScore 必须与文字分析一致。
4. 必须围绕“${relationshipPrompt}”措辞，不要偏离用户选择的关系类型。
5. 请严格按照 JSON schema 返回结果。`;

  return {
    instructions:
      '你是一个深耕中国传统命理的道士，精通八字关系合盘。必须按用户选择的关系类型输出结构化关系判断。',
    input,
    schema: SIMPLE_SCHEMAS.compatibility,
  };
}

const BUILDERS = {
  basicFortune: buildBasicRequest,
  dayunBatch: buildDayunRequest,
  luren: (payload) => buildQuestionRequest('luren', payload),
  xiaoluren: (payload) => buildQuestionRequest('xiaoluren', payload),
  liuyao: (payload) => buildQuestionRequest('liuyao', payload),
  dailyFortune: buildDailyRequest,
  compatibility: buildCompatibilityRequest,
};

export function buildFortuneRequest(body) {
  validateFortunePayload(body);
  const model = Object.prototype.hasOwnProperty.call(body, 'model')
    ? body.model
    : process.env.OPENAI_DEFAULT_MODEL || 'gpt-5.4';

  if (typeof model !== 'string' || !model.trim() || model.length > 120) {
    throw new Error('模型名称不正确。');
  }

  const built = BUILDERS[body.kind](body.payload);

  return {
    model: model.trim(),
    instructions: built.instructions,
    input: built.input,
    text: {
      format: {
        type: 'json_schema',
        name: body.kind,
        strict: true,
        schema: normalizeSchema(built.schema),
      },
    },
    stream: true,
  };
}
