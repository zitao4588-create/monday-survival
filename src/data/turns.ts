import type { GameTurn } from "../gameCore";

export const mondayTurns: GameTurn[] = [
  {
    id: "wake-up",
    title: "07:42 闹钟第三次响起",
    body: "你还有 18 分钟出门。床很暖，消息已经开始跳。",
    choices: [
      {
        id: "wake-water",
        label: "冲澡开机",
        preview: "用冷水把身体叫醒，先把自己找回来。",
        description: "冷水像 HR 提醒，刺耳但有效。",
        visual: "shower-head",
        effect: { scoreDelta: 12, energyDelta: -6, moodDelta: 10 }
      },
      {
        id: "wake-scroll",
        label: "再刷五分钟",
        preview: "再躺一会儿，看看消息和短视频。",
        description: "短视频懂你，闹钟不懂 KPI。",
        visual: "smartphone",
        effect: { scoreDelta: -18, energyDelta: 8, moodDelta: 8 }
      },
      {
        id: "wake-coffee",
        label: "空腹咖啡",
        preview: "先来一杯提神的，早餐路上再说。",
        description: "十分钟回血，胃月底结算。",
        visual: "coffee",
        effect: { scoreDelta: 8, energyDelta: 18, moodDelta: -22 }
      }
    ]
  },
  {
    id: "commute",
    title: "09:11 通勤路上",
    body: "地铁很挤，老板发来一句：到了聊一下。门关上，你的灵魂先迟到了。",
    choices: [
      {
        id: "commute-plan",
        label: "先回收到",
        preview: "给老板一个简单的回应，先稳住场面。",
        description: "两个字挡住一车厢脑补。",
        visual: "message-square-reply",
        effect: { scoreDelta: 12, energyDelta: -4, moodDelta: 4 }
      },
      {
        id: "commute-ignore",
        label: "假装没看到",
        preview: "把手机扣过去，这几站先属于自己。",
        description: "安静三站，焦虑在出口等你。",
        visual: "eye-off",
        effect: { scoreDelta: -22, energyDelta: 4, moodDelta: 8 }
      },
      {
        id: "commute-music",
        label: "地铁里写预案",
        preview: "利用车程，把待会要说的话列一遍。",
        description: "绩效起床了，人还在扶手上晃。",
        visual: "notebook-pen",
        effect: { scoreDelta: 20, energyDelta: -14, moodDelta: -4 }
      }
    ]
  },
  {
    id: "meeting",
    title: "10:30 周会突然加长",
    body: "每个人都说“我简单讲两句”。投影仪都开始怀疑人生。",
    choices: [
      {
        id: "meeting-note",
        label: "只记决策和待办",
        preview: "打开备忘录，只留下关键信息。",
        description: "废话放生，留下能交付的骨头。",
        visual: "notebook-text",
        effect: { scoreDelta: 18, energyDelta: -8, moodDelta: 5 }
      },
      {
        id: "meeting-fight",
        label: "当场温柔补刀",
        preview: "微笑着指出方案里的漏洞。",
        description: "逻辑赢了，空气冷了。",
        visual: "message-circle-warning",
        effect: { scoreDelta: 26, energyDelta: -22, moodDelta: -16 }
      },
      {
        id: "meeting-zoneout",
        label: "灵魂离线两分钟",
        preview: "保持点头频率，让大脑短暂休息。",
        description: "肉身点头，突然被点名。脑内年假当场驳回。",
        visual: "power",
        effect: { scoreDelta: -20, energyDelta: 5, moodDelta: -26 }
      }
    ]
  },
  {
    id: "afternoon",
    title: "15:07 下午低电量",
    body: "三个需求、两个催促和一份“很快就好”的文档同时敲门。",
    choices: [
      {
        id: "afternoon-triage",
        label: "全部同时打开",
        preview: "所有窗口一起开，见招拆招。",
        description: "屏幕像事故现场，你是目击者。",
        visual: "panels-top-left",
        effect: { scoreDelta: 28, energyDelta: -24, moodDelta: -22 }
      },
      {
        id: "afternoon-snack",
        label: "先去买点吃的",
        preview: "下楼走一圈，先喂饱自己。",
        description: "饭不是逃避，是系统补丁。",
        visual: "sandwich",
        effect: { scoreDelta: 4, energyDelta: 16, moodDelta: 12 }
      },
      {
        id: "afternoon-panic",
        label: "砍掉低价值需求",
        preview: "排出优先级，把不重要的往后放。",
        description: "会得罪人，但能救今天。",
        visual: "list-filter",
        effect: { scoreDelta: 22, energyDelta: -16, moodDelta: -16 }
      }
    ]
  },
  {
    id: "closing",
    title: "18:46 下班前最后一击",
    body: "有人说：这个能不能今天顺手改一下？顺手两个字最不顺手。",
    choices: [
      {
        id: "closing-boundary",
        label: "说明明早处理",
        preview: "礼貌说明情况，承诺明早第一件事处理。",
        description: "边界感上线，语气像自动回复。",
        visual: "calendar-clock",
        effect: { scoreDelta: 18, energyDelta: -5, moodDelta: 12 }
      },
      {
        id: "closing-overtime",
        label: "硬着头皮加班",
        preview: "留下来把它做完再走。",
        description: "今晚赢了需求，明天输给自己。",
        visual: "laptop",
        effect: { scoreDelta: 30, energyDelta: -32, moodDelta: -24 }
      },
      {
        id: "closing-disappear",
        label: "光速撤离",
        preview: "关电脑背包走人，动作一气呵成。",
        description: "人走了，消息还在追定位。",
        visual: "door-open",
        effect: { scoreDelta: -26, energyDelta: 8, moodDelta: 4 }
      }
    ]
  }
];
