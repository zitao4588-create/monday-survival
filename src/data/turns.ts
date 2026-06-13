import type { GameTurn } from "../gameCore";

export const mondayTurns: GameTurn[] = [
  {
    id: "wake-up",
    title: "07:42 闹钟第三次响起",
    body: "你还有 18 分钟出门。床很暖，消息已经开始跳。",
    choices: [
      {
        id: "wake-water",
        label: "喝水起床",
        description: "慢一点，但今天至少从清醒开始。",
        effect: { scoreDelta: 12, energyDelta: 8, moodDelta: 4 }
      },
      {
        id: "wake-scroll",
        label: "再刷五分钟",
        description: "五分钟通常不是五分钟。",
        effect: { scoreDelta: -8, energyDelta: -12, moodDelta: -6 }
      },
      {
        id: "wake-coffee",
        label: "空腹咖啡",
        description: "立刻启动，但胃会记仇。",
        effect: { scoreDelta: 5, energyDelta: 18, moodDelta: -10 }
      }
    ]
  },
  {
    id: "commute",
    title: "09:11 通勤路上",
    body: "地铁很挤，老板发来一句：到了聊一下。",
    choices: [
      {
        id: "commute-plan",
        label: "先列三条应对",
        description: "把未知拆小，焦虑会少一点。",
        effect: { scoreDelta: 14, energyDelta: -4, moodDelta: 8 }
      },
      {
        id: "commute-ignore",
        label: "假装没看到",
        description: "短暂安静，长期加倍。",
        effect: { scoreDelta: -10, energyDelta: 4, moodDelta: -12 }
      },
      {
        id: "commute-music",
        label: "戴耳机听歌",
        description: "先救情绪，再救工作。",
        effect: { scoreDelta: 6, energyDelta: 2, moodDelta: 12 }
      }
    ]
  },
  {
    id: "meeting",
    title: "10:30 周会突然加长",
    body: "每个人都说“我简单讲两句”。你知道这句话不简单。",
    choices: [
      {
        id: "meeting-note",
        label: "只记决策和待办",
        description: "不跟废话硬碰硬。",
        effect: { scoreDelta: 16, energyDelta: -8, moodDelta: 4 }
      },
      {
        id: "meeting-fight",
        label: "当场纠正所有问题",
        description: "很爽，但会开出新会。",
        effect: { scoreDelta: 4, energyDelta: -18, moodDelta: -14 }
      },
      {
        id: "meeting-zoneout",
        label: "灵魂短暂离线",
        description: "身体在场，意识休眠。",
        effect: { scoreDelta: -12, energyDelta: 6, moodDelta: -8 }
      }
    ]
  },
  {
    id: "afternoon",
    title: "15:07 下午低电量",
    body: "你收到三个需求、两个催促和一份“很快就好”的文档。",
    choices: [
      {
        id: "afternoon-triage",
        label: "按影响排序处理",
        description: "先处理会真的改变结果的事。",
        effect: { scoreDelta: 18, energyDelta: -10, moodDelta: 6 }
      },
      {
        id: "afternoon-snack",
        label: "先去买点吃的",
        description: "人类不是永动机。",
        effect: { scoreDelta: 7, energyDelta: 14, moodDelta: 8 }
      },
      {
        id: "afternoon-panic",
        label: "全部同时打开",
        description: "看起来很忙，实际上很伤。",
        effect: { scoreDelta: -14, energyDelta: -22, moodDelta: -16 }
      }
    ]
  },
  {
    id: "closing",
    title: "18:46 下班前最后一击",
    body: "有人说：这个能不能今天顺手改一下？",
    choices: [
      {
        id: "closing-boundary",
        label: "说明明早处理",
        description: "边界感也是生产力。",
        effect: { scoreDelta: 18, energyDelta: -4, moodDelta: 10 }
      },
      {
        id: "closing-overtime",
        label: "硬着头皮加班",
        description: "今天过了，明天会找你算账。",
        effect: { scoreDelta: 8, energyDelta: -24, moodDelta: -18 }
      },
      {
        id: "closing-disappear",
        label: "光速撤离",
        description: "动作很快，风险也很快。",
        effect: { scoreDelta: -8, energyDelta: 8, moodDelta: 2 }
      }
    ]
  }
];
