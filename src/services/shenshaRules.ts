import { Solar } from "lunar-javascript";

type ShenshaInfo = {
  name: string;
  description: string;
};

type PillarData = {
  ganzhi: string;
  canggan: string;
  shensha: ShenshaInfo[];
};

type DeterministicBazi = {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData;
};

type PillarKey = keyof DeterministicBazi;

type ParsedPillar = {
  key: PillarKey;
  ganzhi: string;
  stem: string;
  branch: string;
};

const hiddenStemMap: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const tianyiGuirenMap: Record<string, string[]> = {
  甲: ["丑", "未"],
  戊: ["丑", "未"],
  乙: ["子", "申"],
  己: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
  庚: ["寅", "午"],
  辛: ["寅", "午"],
};

const wenchangGuirenMap: Record<string, string[]> = {
  甲: ["巳"],
  乙: ["午"],
  丙: ["申"],
  戊: ["申"],
  丁: ["酉"],
  己: ["酉"],
  庚: ["亥"],
  辛: ["子"],
  壬: ["寅"],
  癸: ["卯"],
};

const guoyinGuirenMap: Record<string, string[]> = {
  甲: ["丑"],
  戊: ["丑"],
  乙: ["辰"],
  己: ["辰"],
  丙: ["未"],
  丁: ["未"],
  庚: ["戌"],
  辛: ["戌"],
  壬: ["丑"],
  癸: ["丑"],
};

const taijiGuirenMap: Record<string, string[]> = {
  甲: ["子", "午"],
  乙: ["子", "午"],
  丙: ["卯", "酉"],
  丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"],
  己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"],
  辛: ["寅", "亥"],
  壬: ["巳", "申"],
  癸: ["巳", "申"],
};

const fuxingGuirenMap: Record<string, string[]> = {
  甲: ["寅", "子"],
  乙: ["卯", "丑"],
  丙: ["子"],
  丁: ["亥"],
  戊: ["申"],
  己: ["未"],
  庚: ["午"],
  辛: ["巳"],
  壬: ["辰"],
  癸: ["卯"],
};

const tiandeMap: Record<string, string[]> = {
  寅: ["丁"],
  卯: ["申"],
  辰: ["壬"],
  巳: ["辛"],
  午: ["亥"],
  未: ["甲"],
  申: ["癸"],
  酉: ["寅"],
  戌: ["丙"],
  亥: ["乙"],
  子: ["巳"],
  丑: ["庚"],
};

const yuedeMap: Record<string, string[]> = {
  寅: ["丙"],
  午: ["丙"],
  戌: ["丙"],
  申: ["壬"],
  子: ["壬"],
  辰: ["壬"],
  亥: ["甲"],
  卯: ["甲"],
  未: ["甲"],
  巳: ["庚"],
  酉: ["庚"],
  丑: ["庚"],
};

const taohuaMap: Record<string, string[]> = {
  寅: ["卯"],
  午: ["卯"],
  戌: ["卯"],
  申: ["酉"],
  子: ["酉"],
  辰: ["酉"],
  巳: ["午"],
  酉: ["午"],
  丑: ["午"],
  亥: ["子"],
  卯: ["子"],
  未: ["子"],
};

const yimaMap: Record<string, string[]> = {
  寅: ["申"],
  午: ["申"],
  戌: ["申"],
  申: ["寅"],
  子: ["寅"],
  辰: ["寅"],
  巳: ["亥"],
  酉: ["亥"],
  丑: ["亥"],
  亥: ["巳"],
  卯: ["巳"],
  未: ["巳"],
};

const huagaiMap: Record<string, string[]> = {
  寅: ["戌"],
  午: ["戌"],
  戌: ["戌"],
  申: ["辰"],
  子: ["辰"],
  辰: ["辰"],
  巳: ["丑"],
  酉: ["丑"],
  丑: ["丑"],
  亥: ["未"],
  卯: ["未"],
  未: ["未"],
};

const jiangxingMap: Record<string, string[]> = {
  寅: ["午"],
  午: ["午"],
  戌: ["午"],
  申: ["子"],
  子: ["子"],
  辰: ["子"],
  巳: ["酉"],
  酉: ["酉"],
  丑: ["酉"],
  亥: ["卯"],
  卯: ["卯"],
  未: ["卯"],
};

const jieshaMap: Record<string, string[]> = {
  寅: ["亥"],
  午: ["亥"],
  戌: ["亥"],
  申: ["巳"],
  子: ["巳"],
  辰: ["巳"],
  巳: ["寅"],
  酉: ["寅"],
  丑: ["寅"],
  亥: ["申"],
  卯: ["申"],
  未: ["申"],
};

const wangshenMap: Record<string, string[]> = {
  寅: ["巳"],
  午: ["巳"],
  戌: ["巳"],
  申: ["亥"],
  子: ["亥"],
  辰: ["亥"],
  巳: ["申"],
  酉: ["申"],
  丑: ["申"],
  亥: ["寅"],
  卯: ["寅"],
  未: ["寅"],
};

const guchenMap: Record<string, string[]> = {
  亥: ["寅"],
  子: ["寅"],
  丑: ["寅"],
  寅: ["巳"],
  卯: ["巳"],
  辰: ["巳"],
  巳: ["申"],
  午: ["申"],
  未: ["申"],
  申: ["亥"],
  酉: ["亥"],
  戌: ["亥"],
};

const guasuMap: Record<string, string[]> = {
  亥: ["戌"],
  子: ["戌"],
  丑: ["戌"],
  寅: ["丑"],
  卯: ["丑"],
  辰: ["丑"],
  巳: ["辰"],
  午: ["辰"],
  未: ["辰"],
  申: ["未"],
  酉: ["未"],
  戌: ["未"],
};

const dahaoMap: Record<string, string[]> = {
  子: ["巳"],
  丑: ["午"],
  寅: ["未"],
  卯: ["申"],
  辰: ["酉"],
  巳: ["戌"],
  午: ["亥"],
  未: ["子"],
  申: ["丑"],
  酉: ["寅"],
  戌: ["卯"],
  亥: ["辰"],
};

const hongluanMap: Record<string, string[]> = {
  子: ["卯"],
  丑: ["寅"],
  寅: ["丑"],
  卯: ["子"],
  辰: ["亥"],
  巳: ["戌"],
  午: ["酉"],
  未: ["申"],
  申: ["未"],
  酉: ["午"],
  戌: ["巳"],
  亥: ["辰"],
};

const tianxiMap: Record<string, string[]> = {
  子: ["酉"],
  丑: ["申"],
  寅: ["未"],
  卯: ["午"],
  辰: ["巳"],
  巳: ["辰"],
  午: ["卯"],
  未: ["寅"],
  申: ["丑"],
  酉: ["子"],
  戌: ["亥"],
  亥: ["戌"],
};

const zaishaMap: Record<string, string[]> = {
  子: ["午"],
  丑: ["卯"],
  寅: ["子"],
  卯: ["酉"],
  辰: ["午"],
  巳: ["卯"],
  午: ["子"],
  未: ["酉"],
  申: ["午"],
  酉: ["卯"],
  戌: ["子"],
  亥: ["酉"],
};

const yangrenMap: Record<string, string[]> = {
  甲: ["卯"],
  乙: ["寅"],
  丙: ["午"],
  丁: ["巳"],
  戊: ["午"],
  己: ["巳"],
  庚: ["酉"],
  辛: ["申"],
  壬: ["子"],
  癸: ["亥"],
};

const ganluMap: Record<string, string[]> = {
  甲: ["寅"],
  乙: ["卯"],
  丙: ["巳"],
  丁: ["午"],
  戊: ["巳"],
  己: ["午"],
  庚: ["申"],
  辛: ["酉"],
  壬: ["亥"],
  癸: ["子"],
};

const jinyuMap: Record<string, string[]> = {
  甲: ["辰"],
  乙: ["巳"],
  丙: ["未"],
  戊: ["未"],
  丁: ["申"],
  己: ["申"],
  庚: ["戌"],
  辛: ["亥"],
  壬: ["丑"],
  癸: ["寅"],
};

const hongyanMap: Record<string, string[]> = {
  甲: ["午"],
  乙: ["申"],
  丙: ["寅"],
  丁: ["未"],
  戊: ["辰"],
  己: ["辰"],
  庚: ["戌"],
  辛: ["酉"],
  壬: ["子"],
  癸: ["申"],
};

const yinyangChacuoDays = new Set([
  "丙子",
  "丁丑",
  "戊寅",
  "辛卯",
  "壬辰",
  "癸巳",
  "丙午",
  "丁未",
  "戊申",
  "辛酉",
  "壬戌",
  "癸亥",
]);

const ganzhiCycle = [
  "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
  "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
  "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
  "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
  "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
  "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥",
];

const kongwangByXunStart: Record<string, string[]> = {
  甲子: ["戌", "亥"],
  甲戌: ["申", "酉"],
  甲申: ["午", "未"],
  甲午: ["辰", "巳"],
  甲辰: ["寅", "卯"],
  甲寅: ["子", "丑"],
};

const pillarStageMap: Record<PillarKey, string> = {
  year: "年柱主幼年阶段。",
  month: "月柱主青年阶段。",
  day: "日柱主中年阶段。",
  hour: "时柱主晚年阶段。",
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parsePillar(key: PillarKey, ganzhi: string): ParsedPillar {
  const chars = Array.from(ganzhi);
  return {
    key,
    ganzhi,
    stem: chars[0] || "",
    branch: chars[1] || "",
  };
}

function getKongwangBranches(dayGanzhi: string): string[] {
  const index = ganzhiCycle.indexOf(dayGanzhi);
  if (index === -1) {
    return [];
  }

  const xunStart = ganzhiCycle[index - (index % 10)];
  return kongwangByXunStart[xunStart] || [];
}

export function buildDeterministicBazi(exactBazi: string): DeterministicBazi {
  const [yearGanzhi, monthGanzhi, dayGanzhi, hourGanzhi] = exactBazi.trim().split(/\s+/);
  const pillars: ParsedPillar[] = [
    parsePillar("year", yearGanzhi),
    parsePillar("month", monthGanzhi),
    parsePillar("day", dayGanzhi),
    parsePillar("hour", hourGanzhi),
  ];

  const starBucket = new Map<PillarKey, Map<string, ShenshaInfo>>();
  pillars.forEach((pillar) => {
    starBucket.set(pillar.key, new Map<string, ShenshaInfo>());
  });

  const addBranchStar = (targetBranches: string[], name: string, description: string) => {
    const branchSet = new Set(targetBranches);
    pillars.forEach((pillar) => {
      if (branchSet.has(pillar.branch)) {
        starBucket.get(pillar.key)?.set(name, {
          name,
          description: `${pillarStageMap[pillar.key]} ${description}`,
        });
      }
    });
  };

  const addStemStar = (targetStems: string[], name: string, description: string) => {
    const stemSet = new Set(targetStems);
    pillars.forEach((pillar) => {
      if (stemSet.has(pillar.stem)) {
        starBucket.get(pillar.key)?.set(name, {
          name,
          description: `${pillarStageMap[pillar.key]} ${description}`,
        });
      }
    });
  };

  const yearStem = pillars[0].stem;
  const yearBranch = pillars[0].branch;
  const monthBranch = pillars[1].branch;
  const dayStem = pillars[2].stem;
  const dayBranch = pillars[2].branch;
  const kongwangBranches = getKongwangBranches(dayGanzhi);

  addBranchStar(uniqueValues([...(tianyiGuirenMap[yearStem] || []), ...(tianyiGuirenMap[dayStem] || [])]), "天乙贵人", "按年干、日干查，主逢凶化吉、遇事易得助力。");
  addBranchStar(wenchangGuirenMap[dayStem] || [], "文昌贵人", "按日干查，主文思、学习、表达、考试与证书运。");
  addBranchStar(guoyinGuirenMap[dayStem] || [], "国印贵人", "按日干查，主守规矩、重名誉，利资质、公职与印信。");
  addBranchStar(taijiGuirenMap[dayStem] || [], "太极贵人", "按日干查，主悟性、研究心、玄学宗教或哲思气质。");
  addBranchStar(fuxingGuirenMap[dayStem] || [], "福星贵人", "按日干查，主福气、人缘与逢险转圜。");
  addStemStar(tiandeMap[monthBranch] || [], "天德贵人", "按月支查天干，主心性厚道，遇事易减凶增吉。");
  addStemStar(yuedeMap[monthBranch] || [], "月德贵人", "按月支查天干，主心地良善，逢事多得和解与照应。");

  addBranchStar(uniqueValues([...(taohuaMap[yearBranch] || []), ...(taohuaMap[dayBranch] || [])]), "桃花", "按年支、日支查，主异性缘、社交魅力与情感波动。");
  addBranchStar(uniqueValues([...(yimaMap[yearBranch] || []), ...(yimaMap[dayBranch] || [])]), "驿马", "按年支、日支查，主奔波、迁移、出行与环境变动。");
  addBranchStar(uniqueValues([...(huagaiMap[yearBranch] || []), ...(huagaiMap[dayBranch] || [])]), "华盖", "按年支、日支查，主艺术、独处、宗教与思辨倾向。");
  addBranchStar(uniqueValues([...(jiangxingMap[yearBranch] || []), ...(jiangxingMap[dayBranch] || [])]), "将星", "按年支、日支查，主掌控力、领导气场与担当。");
  addBranchStar(uniqueValues([...(jieshaMap[yearBranch] || []), ...(jieshaMap[dayBranch] || [])]), "劫煞", "按年支、日支查，主劫夺、病伤、官非或突发损耗，宜看制化。");
  addBranchStar(uniqueValues([...(wangshenMap[yearBranch] || []), ...(wangshenMap[dayBranch] || [])]), "亡神", "按年支、日支查，主虚耗、暗疾、心烦与小人是非。");

  addBranchStar(guchenMap[yearBranch] || [], "孤辰", "按年支查，主孤独感、不喜群聚，婚缘常偏迟。");
  addBranchStar(guasuMap[yearBranch] || [], "寡宿", "按年支查，主孤寂、六亲缘薄，婚姻波折宜晚论。");
  addBranchStar(dahaoMap[yearBranch] || [], "大耗", "按年支查，主额外破耗、损财或不必要的花费。");
  addBranchStar(hongluanMap[yearBranch] || [], "红鸾", "按年支查，主婚缘、喜庆、人情往来与喜事信息。");
  addBranchStar(tianxiMap[yearBranch] || [], "天喜", "按年支查，主喜庆、婚讯、添丁与人际和合。");
  addBranchStar(zaishaMap[yearBranch] || [], "灾煞", "按年支查，主意外波折与外界压力，宜看原局承受力。");

  addBranchStar(yangrenMap[dayStem] || [], "羊刃", "按日干查，主刚烈、执行力与压力并存，喜制化。");
  addBranchStar(ganluMap[dayStem] || [], "禄神", "按日干查，主衣食、气力、福气与自持能力。");
  addBranchStar(jinyuMap[dayStem] || [], "金舆", "按日干查，主福厚、车马、体面与出行便利。");
  addBranchStar(hongyanMap[dayStem] || [], "红艳煞", "按日干查，主情感吸引力、单恋暗恋或情意执着。");

  if (yinyangChacuoDays.has(dayGanzhi)) {
    starBucket.get("day")?.set("阴阳差错日", {
      name: "阴阳差错日",
      description: `${pillarStageMap.day} 日柱落阴阳差错，婚恋与配偶互动宜防失衡与误解。`,
    });
  }

  if (kongwangBranches.length) {
    pillars.forEach((pillar) => {
      if (kongwangBranches.includes(pillar.branch)) {
        starBucket.get(pillar.key)?.set("空亡", {
          name: "空亡",
          description: `${pillarStageMap[pillar.key]} 该柱落空亡，吉神减吉、凶煞减凶，事情易有虚悬反复。`,
        });
      }
    });
  }

  return {
    year: {
      ganzhi: pillars[0].ganzhi,
      canggan: (hiddenStemMap[pillars[0].branch] || []).join(" "),
      shensha: Array.from(starBucket.get("year")?.values() || []),
    },
    month: {
      ganzhi: pillars[1].ganzhi,
      canggan: (hiddenStemMap[pillars[1].branch] || []).join(" "),
      shensha: Array.from(starBucket.get("month")?.values() || []),
    },
    day: {
      ganzhi: pillars[2].ganzhi,
      canggan: (hiddenStemMap[pillars[2].branch] || []).join(" "),
      shensha: Array.from(starBucket.get("day")?.values() || []),
    },
    hour: {
      ganzhi: pillars[3].ganzhi,
      canggan: (hiddenStemMap[pillars[3].branch] || []).join(" "),
      shensha: Array.from(starBucket.get("hour")?.values() || []),
    },
  };
}

export function buildDailyShensha(targetDate: string): ShenshaInfo[] {
  const [year, month, day] = targetDate.split("-").map(Number);
  const solar = Solar.fromYmdHms(year, month, day, 12, 0, 0);
  const lunar = solar.getLunar();
  const yearGanzhi = lunar.getEightChar().getYear();
  const monthGanzhi = lunar.getEightChar().getMonth();
  const dayGanzhi = lunar.getEightChar().getDay();
  const dayStem = Array.from(dayGanzhi)[0] || "";
  const dayBranch = Array.from(dayGanzhi)[1] || "";
  const yearBranch = Array.from(yearGanzhi)[1] || "";
  const monthBranch = Array.from(monthGanzhi)[1] || "";
  const kongwangBranches = getKongwangBranches(dayGanzhi);

  const stars = new Map<string, ShenshaInfo>();
  const add = (name: string, description: string) => {
    stars.set(name, { name, description });
  };

  if ((tianyiGuirenMap[dayStem] || []).includes(dayBranch)) add("天乙贵人", "流日以日干起天乙，今天逢事较易得贵人帮扶。");
  if ((wenchangGuirenMap[dayStem] || []).includes(dayBranch)) add("文昌贵人", "流日以日干起文昌，今天利学习、写作、考试与沟通。");
  if ((guoyinGuirenMap[dayStem] || []).includes(dayBranch)) add("国印贵人", "流日以日干起国印，今天利文书、资质、制度事务与签署。");
  if ((taijiGuirenMap[dayStem] || []).includes(dayBranch)) add("太极贵人", "流日以日干起太极，今天适合研究、思考与静心判断。");
  if ((fuxingGuirenMap[dayStem] || []).includes(dayBranch)) add("福星贵人", "流日以日干起福星，今天做事较有缓冲与转圜空间。");
  if ((yangrenMap[dayStem] || []).includes(dayBranch)) add("羊刃", "流日羊刃当值，行动力强，但要防刚过易折。");
  if ((ganluMap[dayStem] || []).includes(dayBranch)) add("禄神", "流日日干临禄，今天求财、执行与争取资源更有着力点。");
  if ((jinyuMap[dayStem] || []).includes(dayBranch)) add("金舆", "流日现金舆，今天利出行、体面事务与福庆之事。");
  if ((hongyanMap[dayStem] || []).includes(dayBranch)) add("红艳煞", "流日现红艳，今天情绪与情感吸引力较显，宜自持。");
  if ((tiandeMap[monthBranch] || []).includes(dayStem)) add("天德贵人", "流日月支起天德，今天遇事较有缓和余地。");
  if ((yuedeMap[monthBranch] || []).includes(dayStem)) add("月德贵人", "流日月支起月德，今天人情往来与和解气场较强。");
  if ((taohuaMap[yearBranch] || []).includes(dayBranch)) add("桃花", "流日触发桃花位，今天社交、异性缘与情绪波动更明显。");
  if ((yimaMap[yearBranch] || []).includes(dayBranch)) add("驿马", "流日触发驿马，今天多奔波、外出、差旅或事务变动。");
  if ((huagaiMap[yearBranch] || []).includes(dayBranch)) add("华盖", "流日触发华盖，今天偏向独处、创作、研究与思考。");
  if ((jiangxingMap[yearBranch] || []).includes(dayBranch)) add("将星", "流日触发将星，今天主执行、决断与管理气场增强。");
  if ((jieshaMap[yearBranch] || []).includes(dayBranch)) add("劫煞", "流日触发劫煞，今天要防破耗、冲动、官非或磕碰损伤。");
  if ((wangshenMap[yearBranch] || []).includes(dayBranch)) add("亡神", "流日触发亡神，今天要防虚耗、小人、暗病与判断偏差。");
  if ((guchenMap[yearBranch] || []).includes(dayBranch)) add("孤辰", "流日触发孤辰，今天更易感到疏离，宜少钻牛角尖。");
  if ((guasuMap[yearBranch] || []).includes(dayBranch)) add("寡宿", "流日触发寡宿，今天情感表达偏冷，宜多沟通。");
  if ((dahaoMap[yearBranch] || []).includes(dayBranch)) add("大耗", "流日触发大耗，今天要防不必要的花费与损耗。");
  if ((hongluanMap[yearBranch] || []).includes(dayBranch)) add("红鸾", "流日触发红鸾，今天婚缘、喜讯、人情互动较活跃。");
  if ((tianxiMap[yearBranch] || []).includes(dayBranch)) add("天喜", "流日触发天喜，今天喜庆、和合、添丁类信息较旺。");
  if ((zaishaMap[yearBranch] || []).includes(dayBranch)) add("灾煞", "流日触发灾煞，今天宜防外界冲突、惊扰与意外波折。");
  if (yinyangChacuoDays.has(dayGanzhi)) add("阴阳差错日", "今天落阴阳差错，婚恋沟通与关系判断宜更谨慎。");
  if (kongwangBranches.includes(dayBranch)) add("空亡", "今天落空亡，事情易有拖延、落空、反复或表面化。");

  return Array.from(stars.values());
}
