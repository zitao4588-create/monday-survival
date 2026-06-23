import type { CSSProperties, ReactNode } from "react";
import feedbackCardRef from "../../assets/component-refs/feedback-card.png";
import nextEventCardRef from "../../assets/component-refs/next-event-card.png";
import paperHeaderRef from "../../assets/component-refs/paper-header.png";
import primaryButtonRef from "../../assets/component-refs/primary-button.png";
import resultPaperRef from "../../assets/component-refs/result-paper.png";
import secondaryButtonRef from "../../assets/component-refs/secondary-button.png";
import statCardRef from "../../assets/component-refs/stat-card.png";
import choiceTicketGreenRef from "../../assets/component-refs/choice-ticket-green.png";
import choiceTicketRedRef from "../../assets/component-refs/choice-ticket-red.png";
import choiceTicketYellowRef from "../../assets/component-refs/choice-ticket-yellow.png";
import { mondayTurns } from "../../game";
import { toChoiceViewModel, toEventViewModel, toStatViewModels } from "../../gameViewModels";
import type { ResultViewModel } from "../visualTypes";
import { SkinChoiceTicket, SkinFeedbackCard, SkinNextEventCard, SkinPaperHeader, SkinPrimaryButton, SkinResultPaper, SkinSecondaryButton, SkinStatCard } from "./SkinPreviewComponents";
import "../../styles/component-skin.css";

interface LabItem {
  className: string;
  height: number;
  name: string;
  reference: string;
  render: ReactNode;
  width: number;
}

const labChoices = mondayTurns[0].choices.map(toChoiceViewModel);
const labSelectedChoice = labChoices[0];
const labNextEvent = toEventViewModel(mondayTurns[1], "train");
const labStats = toStatViewModels({ energy: 70, mood: 60, score: 0 });
const labResultStats = toStatViewModels({ energy: 52, mood: 92, score: 78 });
const labResult: ResultViewModel = {
  description: "你不仅熬过了周一，还保住了明天的自己。",
  personaLabel: "边界感幸存者",
  personaQuote: "在混乱里守住边界，就是一种高级生存力。",
  title: "体面下班"
};

const choiceTone: Array<"green" | "yellow" | "rust"> = ["green", "yellow", "rust"];

const labItems: LabItem[] = [
  {
    className: "paper-header",
    height: 82,
    name: "PaperHeader",
    reference: paperHeaderRef,
    render: <SkinPaperHeader badge="第 1/5 回合" />,
    width: 374
  },
  {
    className: "stat-card",
    height: 90,
    name: "StatCard",
    reference: statCardRef,
    render: <SkinStatCard {...labStats[0]} />,
    width: 124
  },
  {
    className: "choice-ticket",
    height: 119,
    name: "ChoiceTicket green",
    reference: choiceTicketGreenRef,
    render: <SkinChoiceTicket choice={labChoices[0]} index={0} tone={choiceTone[0]} />,
    width: 370
  },
  {
    className: "choice-ticket",
    height: 118,
    name: "ChoiceTicket yellow",
    reference: choiceTicketYellowRef,
    render: <SkinChoiceTicket choice={labChoices[1]} index={1} tone={choiceTone[1]} />,
    width: 370
  },
  {
    className: "choice-ticket",
    height: 119,
    name: "ChoiceTicket red",
    reference: choiceTicketRedRef,
    render: <SkinChoiceTicket choice={labChoices[2]} index={2} tone={choiceTone[2]} />,
    width: 370
  },
  {
    className: "feedback-card",
    height: 330,
    name: "FeedbackCard",
    reference: feedbackCardRef,
    render: <SkinFeedbackCard selectedChoice={labSelectedChoice} />,
    width: 370
  },
  {
    className: "next-event-card",
    height: 169,
    name: "NextEventCard",
    reference: nextEventCardRef,
    render: <SkinNextEventCard event={labNextEvent} />,
    width: 370
  },
  {
    className: "result-paper",
    height: 739,
    name: "ResultPaper",
    reference: resultPaperRef,
    render: <SkinResultPaper result={labResult} stats={labResultStats} />,
    width: 370
  },
  {
    className: "primary-button",
    height: 71,
    name: "PrimaryButton",
    reference: primaryButtonRef,
    render: <SkinPrimaryButton />,
    width: 311
  },
  {
    className: "secondary-button",
    height: 57,
    name: "SecondaryButton",
    reference: secondaryButtonRef,
    render: <SkinSecondaryButton />,
    width: 311
  }
];

function getComponentSizeStyle(item: LabItem) {
  return {
    "--component-height": `${item.height}px`,
    "--component-width": `${item.width}px`
  } as CSSProperties;
}

export function ComponentLab() {
  return (
    <main className="ms-component-lab">
      <header className="ms-component-lab__header">
        <p>Component fidelity lab</p>
        <h1>周一生存视觉组件对照</h1>
        <span>左侧是参考图裁剪，右侧是真实 React 组件。</span>
      </header>

      <div className="ms-component-lab__list">
        {labItems.map((item) => (
          <section className="ms-component-lab__item" key={item.name}>
            <h2>{item.name}</h2>
            <div className="ms-component-lab__pair">
              <figure>
                <figcaption>Reference component crop</figcaption>
                <div
                  className="ms-component-lab__frame"
                  style={getComponentSizeStyle(item)}
                >
                  <img src={item.reference} alt={`${item.name} reference crop`} />
                </div>
              </figure>

              <figure>
                <figcaption>Current React component</figcaption>
                <div
                  className={`ms-component-lab__render ms-component-lab__render--${item.className}`}
                  style={getComponentSizeStyle(item)}
                >
                  {item.render}
                </div>
              </figure>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
