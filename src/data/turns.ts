import type { GameTurn, GameTurnPeriod } from "../gameCore";

export const mondayTurnPools: Record<GameTurnPeriod, GameTurn[]> = {
  "wake-up": [
    {
      id: "wake-up", period: "wake-up", title: "07:42 闹钟第三次响起",
      body: "你还有 18 分钟出门。床很暖，消息已经开始跳。",
      choices: [
        { id: "wake-water", label: "冲澡开机", preview: "用冷水把身体叫醒，先把自己找回来。", description: "冷水像 HR 提醒，刺耳但有效。", impactSummary: "你牺牲一点舒服，换来了清醒和重新掌控今天的感觉。", visual: "shower-head", effect: { scoreDelta: 12, energyDelta: -6, moodDelta: 10 }, tags: ["wake-alert", "self-care"] },
        { id: "wake-scroll", label: "再刷五分钟", preview: "再躺一会儿，看看消息和短视频。", description: "短视频懂你，闹钟不懂 KPI。", impactSummary: "这五分钟很甜，起床后的每一步却都更赶。", visual: "smartphone", effect: { scoreDelta: -18, energyDelta: 8, moodDelta: 8 }, tags: ["wake-delay", "mood-first"] },
        { id: "wake-coffee", label: "空腹咖啡", preview: "先来一杯提神的，早餐路上再说。", description: "十分钟回血，胃月底结算。", impactSummary: "清醒被提前透支，胃和情绪接过了账单。", visual: "coffee", effect: { scoreDelta: 8, energyDelta: 18, moodDelta: -22 }, tags: ["wake-caffeine", "energy-first"] }
      ]
    },
    {
      id: "wake-rain", period: "wake-up", title: "07:36 窗外突然暴雨",
      body: "雨声比闹钟先打卡。打车排队 86 人，鞋柜里没有一双想上班。",
      choices: [
        { id: "wake-rain-early", label: "立刻出门", preview: "抓伞冲下楼，把延误留给路况。", description: "裤脚先湿，考勤暂时安全。", impactSummary: "你用体力换到准点，也把狼狈提前穿在身上。", visual: "door-open", effect: { scoreDelta: 23, energyDelta: -14, moodDelta: -5 }, tags: ["wake-alert", "performance-first"] },
        { id: "wake-rain-remote", label: "申请晚到", preview: "说明天气情况，先在家处理消息。", description: "理由很正当，发送键还是有点重。", impactSummary: "你保住了干爽和效率，但要承担一次边界试探。", visual: "message-square-reply", effect: { scoreDelta: 8, energyDelta: 5, moodDelta: 8 }, tags: ["wake-plan", "boundary"] },
        { id: "wake-rain-wait", label: "等雨小点", preview: "再坐十分钟，让雨和人潮先走。", description: "雨小了，未读消息大了。", impactSummary: "你换到从容出门，迟到焦虑却一路同行。", visual: "coffee", effect: { scoreDelta: -28, energyDelta: 10, moodDelta: 10 }, tags: ["wake-delay", "mood-first"] }
      ]
    },
    {
      id: "wake-laundry", period: "wake-up", title: "07:51 衬衫还在洗衣机",
      body: "昨晚的洗衣提醒被你划掉了。八分钟后出门，体面还在脱水。",
      choices: [
        { id: "wake-laundry-dry", label: "吹风机急救", preview: "一手吹领口，一手回工作消息。", description: "衣服半干，人已经全忙。", impactSummary: "你努力维持体面，早晨的电量被双线程吃掉。", visual: "panels-top-left", effect: { scoreDelta: 20, energyDelta: -16, moodDelta: -4 }, tags: ["wake-rush", "performance-first"] },
        { id: "wake-laundry-casual", label: "换件卫衣", preview: "接受今天不正式，舒服出门。", description: "穿搭躺平了，肩膀也松了一点。", impactSummary: "你把舒适排在体面前，目光成本留到公司结算。", visual: "power", effect: { scoreDelta: -22, energyDelta: 8, moodDelta: 14 }, tags: ["wake-comfort", "self-care"] },
        { id: "wake-laundry-buy", label: "路上买一件", preview: "提前下车，用预算解决早晨事故。", description: "时间和钱包一起被叫醒。", impactSummary: "你快速恢复了体面，但赶路和消费都让人肉疼。", visual: "calendar-clock", effect: { scoreDelta: 10, energyDelta: -6, moodDelta: 5 }, tags: ["wake-plan", "problem-solved"] }
      ]
    }
  ],
  commute: [
    {
      id: "commute", period: "commute", title: "09:11 通勤路上",
      body: "地铁很挤，老板发来一句：到了聊一下。门关上，你的灵魂先迟到了。",
      choices: [
        { id: "commute-plan", label: "先回收到", preview: "给老板一个简单回应，先稳住场面。", description: "两个字挡住一车厢脑补。", impactSummary: "一句收到先关掉脑补，但也把你提前拉进工作状态。", visual: "message-square-reply", effect: { scoreDelta: 12, energyDelta: -4, moodDelta: 4 }, tags: ["boss-replied", "commute-prepared"] },
        { id: "commute-ignore", label: "假装没看到", preview: "把手机扣过去，这几站先属于自己。", description: "安静三站，焦虑在出口等你。", impactSummary: "短暂安静保住呼吸，未读消息却一路跟到公司。", visual: "eye-off", effect: { scoreDelta: -22, energyDelta: 4, moodDelta: 8 }, tags: ["boss-ignored", "commute-escaped"] },
        { id: "commute-music", label: "地铁里写预案", preview: "利用车程，把待会要说的话列一遍。", description: "绩效起床了，人还在扶手上晃。", impactSummary: "你把通勤变成预演，踏实了一点，也少了一段放空。", visual: "notebook-pen", effect: { scoreDelta: 20, energyDelta: -14, moodDelta: -4 }, tags: ["boss-replied", "commute-prepared"] }
      ]
    },
    {
      id: "commute-delay", period: "commute", title: "08:58 地铁临时停车",
      body: "广播说稍候，群里说会议照常。信号只够加载老板的三个问号。",
      choices: [
        { id: "commute-delay-report", label: "拍照报备", preview: "发现场照片，顺手给出预计到达时间。", description: "证据先到公司，人还卡在隧道。", impactSummary: "你主动交代降低了误会，也提前消耗了一轮解释力。", visual: "message-square-reply", effect: { scoreDelta: 16, energyDelta: -6, moodDelta: 2 }, tags: ["boss-replied", "commute-prepared"] },
        { id: "commute-delay-silent", label: "等恢复再说", preview: "不在弱信号里解释，先保留安静。", description: "隧道替你静音，出站口不替你。", impactSummary: "你保住片刻清净，迟到和沉默却会同时抵达。", visual: "eye-off", effect: { scoreDelta: -20, energyDelta: 6, moodDelta: 8 }, tags: ["boss-ignored", "commute-escaped"] },
        { id: "commute-delay-hotspot", label: "手机开会", preview: "蹲在车门边，用耳机提前接入。", description: "人没到，工位已经寄生在手机里。", impactSummary: "你守住了会议存在感，通勤最后一点电量被拿走。", visual: "smartphone", effect: { scoreDelta: 24, energyDelta: -18, moodDelta: -12 }, tags: ["boss-replied", "performance-first"] }
      ]
    },
    {
      id: "commute-seat", period: "commute", title: "09:03 终于抢到座位",
      body: "空位像季度奖金突然出现。手机同时弹出一份待会要过的方案。",
      choices: [
        { id: "commute-seat-review", label: "坐着审方案", preview: "趁能展开手臂，把风险点圈出来。", description: "座位给了身体，方案拿走了脑子。", impactSummary: "你带着准备进入公司，通勤休息被完整抵扣。", visual: "notebook-text", effect: { scoreDelta: 22, energyDelta: -15, moodDelta: -5 }, tags: ["boss-replied", "commute-prepared"] },
        { id: "commute-seat-sleep", label: "闭眼六站", preview: "设好震动提醒，给大脑补一小觉。", description: "六站像年假，醒来仍是周一。", impactSummary: "你补回一点精神，工作消息则保持原价等候。", visual: "power", effect: { scoreDelta: -18, energyDelta: 16, moodDelta: 8 }, tags: ["boss-ignored", "commute-rested"] },
        { id: "commute-seat-reply", label: "只回关键问题", preview: "答复最急的一条，然后锁屏。", description: "工作开了一条缝，没有完全涌进来。", impactSummary: "你控制了响应范围，既没失联也没交出整段通勤。", visual: "list-filter", effect: { scoreDelta: 10, energyDelta: 2, moodDelta: 5 }, tags: ["boss-replied", "boundary"] }
      ]
    }
  ],
  morning: [
    {
      id: "meeting", period: "morning", title: "10:30 周会突然加长",
      body: "每个人都说‘我简单讲两句’。投影仪都开始怀疑人生。",
      echoes: { "boss-replied": "老板开场先点头：收到你路上的回复。投影仪随后开始怀疑人生。", "boss-ignored": "老板开场先问：早上消息看到了吗？投影仪跟着你一起沉默。" },
      choices: [
        { id: "meeting-note", label: "只记决策和待办", preview: "打开备忘录，只留下关键信息。", description: "废话放生，留下能交付的骨头。", impactSummary: "只抓重点让脑子轻些，也意味着你得主动扛起收尾。", visual: "notebook-text", effect: { scoreDelta: 18, energyDelta: -8, moodDelta: 5 }, tags: ["meeting-focused", "meeting-steady"] },
        { id: "meeting-fight", label: "当场温柔补刀", preview: "微笑着指出方案里的漏洞。", description: "逻辑赢了，空气冷了。", impactSummary: "你守住了逻辑，会议室里的温度也跟着降了几度。", visual: "message-circle-warning", effect: { scoreDelta: 26, energyDelta: -22, moodDelta: -16 }, tags: ["meeting-firm", "performance-first"] },
        { id: "meeting-zoneout", label: "灵魂离线两分钟", preview: "保持点头频率，让大脑短暂休息。", description: "肉身点头，脑内年假当场驳回。", impactSummary: "两分钟放空换来喘息，被点名时的心跳负责补票。", visual: "power", effect: { scoreDelta: -20, energyDelta: 5, moodDelta: -26 }, tags: ["meeting-zoned-out", "mood-drained"] }
      ]
    },
    {
      id: "meeting-deadline", period: "morning", title: "10:18 截止时间被提前",
      body: "原本周三的交付被一句‘最好今天’推到眼前。所有人开始研究桌面。",
      echoes: { "boss-replied": "老板接着你早上的回复，把周三交付改成‘最好今天’。所有人开始研究桌面。", "boss-ignored": "老板没等到早上的回复，顺手把周三交付改成‘最好今天’。空气更安静了。" },
      choices: [
        { id: "meeting-deadline-scope", label: "先砍交付范围", preview: "明确今天能做什么，把其余拆到明天。", description: "需求瘦身成功，期待值仍然偏胖。", impactSummary: "你守住可交付边界，也承担了现场讨价还价的压力。", visual: "list-filter", effect: { scoreDelta: 18, energyDelta: -8, moodDelta: 6 }, tags: ["meeting-firm", "boundary"] },
        { id: "meeting-deadline-take", label: "先全部接下", preview: "点头认领，回工位再想办法。", description: "会议室很顺利，下午开始还债。", impactSummary: "你换到当场顺畅，却把时间债完整带回座位。", visual: "calendar-clock", effect: { scoreDelta: 25, energyDelta: -20, moodDelta: -15 }, tags: ["meeting-steady", "performance-first"] },
        { id: "meeting-deadline-blur", label: "含糊点头", preview: "先不承诺细节，让话题自然过去。", description: "承诺没落地，焦虑先落地。", impactSummary: "你躲过即时冲突，模糊范围会在下午继续追问。", visual: "eye-off", effect: { scoreDelta: -18, energyDelta: 5, moodDelta: -20 }, tags: ["meeting-zoned-out", "mood-drained"] }
      ]
    },
    {
      id: "meeting-credit", period: "morning", title: "11:02 功劳突然易主",
      body: "你熬夜做的方案，被同事用‘我们团队’轻轻带过。老板正在点头。",
      echoes: { "boss-replied": "老板记得你早上的回应，却没认出这份方案主要出自你手。会议还在继续。", "boss-ignored": "老板还惦记未回的消息，也没认出这份方案主要出自你手。你被双重隐身。" },
      choices: [
        { id: "meeting-credit-add", label: "补充关键细节", preview: "自然接话，用细节把署名带回来。", description: "没有抢话，只把名字放回作品旁边。", impactSummary: "你稳稳拿回可见度，也消耗了一次现场判断。", visual: "message-square-reply", effect: { scoreDelta: 20, energyDelta: -10, moodDelta: 6 }, tags: ["meeting-firm", "self-advocacy"] },
        { id: "meeting-credit-confront", label: "当场说明分工", preview: "直接列出各自负责的部分。", description: "事实站起来了，气氛坐不住了。", impactSummary: "你明确守住劳动成果，关系温度会短暂下降。", visual: "message-circle-warning", effect: { scoreDelta: 28, energyDelta: -20, moodDelta: -18 }, tags: ["meeting-firm", "conflict"] },
        { id: "meeting-credit-later", label: "会后再沟通", preview: "先记下来，不让会议现场失控。", description: "情绪被存为草稿，暂未发送。", impactSummary: "你保住会议秩序，也让委屈在心里多待一会儿。", visual: "notebook-pen", effect: { scoreDelta: -18, energyDelta: 6, moodDelta: -16 }, tags: ["meeting-zoned-out", "conflict-deferred"] }
      ]
    }
  ],
  afternoon: [
    {
      id: "afternoon", period: "afternoon", title: "15:07 下午低电量",
      body: "三个需求、两个催促和一份‘很快就好’的文档同时敲门。",
      echoes: { "meeting-firm": "上午那句强硬回应还在群里回响，三个需求和两个催促同时敲门。", "meeting-zoned-out": "上午漏掉的半句要求变成一份加急文档，和两个催促一起敲门。" },
      choices: [
        { id: "afternoon-triage", label: "全部同时打开", preview: "所有窗口一起开，见招拆招。", description: "屏幕像事故现场，你是目击者。", impactSummary: "你让所有人都看见响应，自己的注意力却被切成碎片。", visual: "panels-top-left", effect: { scoreDelta: 28, energyDelta: -24, moodDelta: -22 }, tags: ["afternoon-push", "multitask"] },
        { id: "afternoon-snack", label: "先去买点吃的", preview: "下楼走一圈，先喂饱自己。", description: "饭不是逃避，是系统补丁。", impactSummary: "你先照顾了身体，催促声会在回来时一起响起。", visual: "sandwich", effect: { scoreDelta: 0, energyDelta: 16, moodDelta: 12 }, tags: ["afternoon-refuel", "self-care"] },
        { id: "afternoon-panic", label: "砍掉低价值需求", preview: "排出优先级，把不重要的往后放。", description: "会得罪人，但能救今天。", impactSummary: "你替今天争回空间，也接下了别人不理解的目光。", visual: "list-filter", effect: { scoreDelta: 22, energyDelta: -16, moodDelta: -16 }, tags: ["afternoon-push", "boundary"] }
      ]
    },
    {
      id: "afternoon-review", period: "afternoon", title: "14:48 文件被打回三次",
      body: "批注只写着‘再高级一点’。你盯着这句话，它也坦然地盯着你。",
      echoes: { "meeting-firm": "上午刚守住逻辑，下午批注只剩‘再高级一点’。耐心开始排队离场。", "meeting-zoned-out": "上午漏听的标准藏进批注：‘再高级一点’。你找不到前半句。" },
      choices: [
        { id: "afternoon-review-ask", label: "追问具体标准", preview: "列出三个方向，请对方明确选择。", description: "模糊需求被请上了证人席。", impactSummary: "你用一次沟通换清晰，也承受对方觉得你不够懂的风险。", visual: "message-circle-warning", effect: { scoreDelta: 20, energyDelta: -12, moodDelta: 4 }, tags: ["afternoon-push", "boundary"] },
        { id: "afternoon-review-break", label: "先吃块饼干", preview: "离开屏幕五分钟，再回来重看。", description: "糖分听懂了需求，人还没有。", impactSummary: "短暂停顿让情绪回温，修改进度则暂时停在原地。", visual: "sandwich", effect: { scoreDelta: -10, energyDelta: 14, moodDelta: 14 }, tags: ["afternoon-refuel", "self-care"] },
        { id: "afternoon-review-redo", label: "全部推倒重做", preview: "不再猜局部，直接换一套方向。", description: "旧文件获得自由，你失去下午。", impactSummary: "你提高了命中可能，也让体力和心情承担重做成本。", visual: "panels-top-left", effect: { scoreDelta: 26, energyDelta: -25, moodDelta: -20 }, tags: ["afternoon-push", "performance-first"] }
      ]
    },
    {
      id: "afternoon-chat", period: "afternoon", title: "15:26 群聊突然点名",
      body: "沉寂半天的项目群突然 @你：这个问题谁来跟一下？输入框像在倒计时。",
      echoes: { "meeting-firm": "上午的强硬发言让大家记住了你。项目群立刻 @你：这个问题谁来跟？", "meeting-zoned-out": "上午没接住的话题绕进项目群，最终 @到你：这个问题谁来跟？" },
      choices: [
        { id: "afternoon-chat-own", label: "直接认领", preview: "先把事情接住，避免继续拉扯。", description: "群聊安静了，你的待办响了。", impactSummary: "你快速推动了事情，下午余量也被顺手清空。", visual: "message-square-reply", effect: { scoreDelta: 24, energyDelta: -22, moodDelta: -16 }, tags: ["afternoon-push", "performance-first"] },
        { id: "afternoon-chat-route", label: "拉齐负责人", preview: "列清依赖，把任务放回正确的人手里。", description: "没有甩锅，只给锅贴了姓名。", impactSummary: "你守住职责边界，也花掉一轮协调精力。", visual: "list-filter", effect: { scoreDelta: 17, energyDelta: -10, moodDelta: 5 }, tags: ["afternoon-push", "boundary"] },
        { id: "afternoon-chat-walk", label: "先接水再回", preview: "离开座位两分钟，整理好再答。", description: "水杯满了，输入框还在等。", impactSummary: "你先恢复一点耐心，响应速度会被群聊悄悄记录。", visual: "coffee", effect: { scoreDelta: -14, energyDelta: 12, moodDelta: 12 }, tags: ["afternoon-refuel", "self-care"] }
      ]
    }
  ],
  closing: [
    {
      id: "closing", period: "closing", title: "18:46 下班前最后一击",
      body: "有人说：这个能不能今天顺手改一下？顺手两个字最不顺手。",
      echoes: { "afternoon-refuel": "下午补给让你还剩一点耐心。有人问：能不能今天顺手改一下？", "afternoon-push": "下午硬扛留下的疲惫刚到货，又有人问：能不能今天顺手改一下？" },
      choices: [
        { id: "closing-boundary", label: "说明明早处理", preview: "礼貌说明情况，承诺明早第一件事处理。", description: "边界感上线，语气像自动回复。", impactSummary: "你守住了下班线，也要承受一句不够配合的想象。", visual: "calendar-clock", effect: { scoreDelta: 18, energyDelta: -5, moodDelta: 12 }, tags: ["closing-boundary", "self-care"] },
        { id: "closing-overtime", label: "硬着头皮加班", preview: "留下来把它做完再走。", description: "今晚赢了需求，明天输给自己。", impactSummary: "事情今晚结束了，疲惫会把明天提前借走。", visual: "laptop", effect: { scoreDelta: 30, energyDelta: -32, moodDelta: -24 }, tags: ["closing-overtime", "performance-first"] },
        { id: "closing-disappear", label: "光速撤离", preview: "关电脑背包走人，动作一气呵成。", description: "人走了，消息还在追定位。", impactSummary: "脚步先获得自由，没回的消息仍在背后追赶。", visual: "door-open", effect: { scoreDelta: -26, energyDelta: 8, moodDelta: 4 }, tags: ["closing-escaped", "mood-first"] }
      ]
    },
    {
      id: "closing-bug", period: "closing", title: "18:32 上线前冒出红灯",
      body: "监控突然飘红，群里问是不是大问题。外卖和回家路线同时弹窗。",
      echoes: { "afternoon-refuel": "下午补过电，你还能看清监控红灯。群里问：是不是大问题？", "afternoon-push": "下午硬扛耗掉专注力，监控偏在此刻飘红。群里开始追问。" },
      choices: [
        { id: "closing-bug-handoff", label: "定位后交接", preview: "查清影响范围，留下步骤给值班同事。", description: "问题没消失，但终于有了门牌号。", impactSummary: "你完成了可靠交接，也为下班线付出一点精力。", visual: "notebook-text", effect: { scoreDelta: 20, energyDelta: -10, moodDelta: 8 }, tags: ["closing-boundary", "problem-solved"] },
        { id: "closing-bug-fix", label: "留下彻底修好", preview: "点外卖，今晚把根因一起处理。", description: "红灯灭了，你也快灭了。", impactSummary: "你换来一次漂亮收尾，身体和情绪承担全部加班费。", visual: "laptop", effect: { scoreDelta: 32, energyDelta: -30, moodDelta: -24 }, tags: ["closing-overtime", "performance-first"] },
        { id: "closing-bug-mute", label: "先静音告警", preview: "确认暂不扩散，明早再完整处理。", description: "世界安静了，风险没有睡。", impactSummary: "你获得今晚的安静，也把不确定性留给明早。", visual: "eye-off", effect: { scoreDelta: -20, energyDelta: 8, moodDelta: 6 }, tags: ["closing-escaped", "risk-deferred"] }
      ]
    },
    {
      id: "closing-dinner", period: "closing", title: "18:15 聚餐邀请弹出来",
      body: "部门群说临时聚餐，备注‘自愿参加’。你的回家倒计时已经开始。",
      echoes: { "afternoon-refuel": "下午补给后状态尚可，部门群又发来一场‘自愿参加’的聚餐。", "afternoon-push": "下午硬扛让电量见底，部门群偏偏发来一场‘自愿参加’的聚餐。" },
      choices: [
        { id: "closing-dinner-go", label: "去露个脸", preview: "吃半小时再走，完成社交打卡。", description: "饭吃到了，人情也签收了。", impactSummary: "你维持了团队连接，回家时间和社交电量一起减少。", visual: "sandwich", effect: { scoreDelta: 16, energyDelta: -14, moodDelta: 5 }, tags: ["closing-social", "performance-first"] },
        { id: "closing-dinner-decline", label: "坦白今天不去", preview: "简单说明疲惫，直接回家。", description: "拒绝发出去了，肩膀先下班。", impactSummary: "你守住休息安排，也接受一次不合群的想象。", visual: "door-open", effect: { scoreDelta: -14, energyDelta: 12, moodDelta: 14 }, tags: ["closing-boundary", "self-care"] },
        { id: "closing-dinner-work", label: "借口继续工作", preview: "留在工位避开聚餐，顺手清掉待办。", description: "社交躲过了，工作没有。", impactSummary: "你避开人群并推进任务，却把下班继续押后。", visual: "laptop", effect: { scoreDelta: 24, energyDelta: -22, moodDelta: -18 }, tags: ["closing-overtime", "commute-escaped"] }
      ]
    }
  ]
};

export const mondayTurnPeriods: GameTurnPeriod[] = ["wake-up", "commute", "morning", "afternoon", "closing"];

// 固定基线只用于静态预览与向后兼容；真实游戏由自然周种子选择事件。
export const mondayTurns: GameTurn[] = mondayTurnPeriods.map((period) => mondayTurnPools[period][0]);
