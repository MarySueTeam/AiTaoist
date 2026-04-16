import assert from 'node:assert/strict';
import {
  buildFourPillarsFromBirthInfo,
  buildFourPillarsFromExactBazi,
  sanitizeDisplayText,
  shouldUseCompactDivinationLayout,
  splitGanzhi,
} from './displayUtils.ts';

assert.equal(sanitizeDisplayText('  势开  \n外欲  '), '势开 外欲');
assert.deepEqual(splitGanzhi('戊寅'), { tiangan: '戊', dizhi: '寅' });

const exactPillars = buildFourPillarsFromExactBazi('乙亥 戊子 丁酉 丙午');
assert.deepEqual(
  exactPillars.map((pillar) => `${pillar.label}:${pillar.ganzhi}`),
  ['年柱:乙亥', '月柱:戊子', '日柱:丁酉', '时柱:丙午']
);

const birthInfoPillars = buildFourPillarsFromBirthInfo('1996-01-01', '12:00');
assert.deepEqual(
  birthInfoPillars.map((pillar) => pillar.ganzhi),
  ['乙亥', '戊子', '丁酉', '丙午']
);

assert.equal(shouldUseCompactDivinationLayout(['势开', '外成', '欲形', '保同'], 2), true);
assert.equal(shouldUseCompactDivinationLayout(['势开', '必须中途调整'], 2), false);
