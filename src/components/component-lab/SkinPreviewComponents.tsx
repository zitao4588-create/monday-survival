import headerLeftTab from "../../assets/component-skins/header-left-tab@2x.png";
import headerPaper from "../../assets/component-skins/header-paper@2x.png";
import headerTape from "../../assets/component-skins/header-tape@2x.png";
import primaryButton from "../../assets/component-skins/primary-button@2x.png";
import secondaryButton from "../../assets/component-skins/secondary-button@2x.png";
import statCardPaper from "../../assets/component-skins/stat-card-paper@2x.png";
import choiceTicketGreen from "../../assets/component-skins/choice-ticket-green@2x.png";
import choiceTicketRed from "../../assets/component-skins/choice-ticket-red@2x.png";
import choiceTicketYellow from "../../assets/component-skins/choice-ticket-yellow@2x.png";
import feedbackCard from "../../assets/component-skins/feedback-card@2x.png";
import nextEventCard from "../../assets/component-skins/next-event-card@2x.png";
import resultPaper from "../../assets/component-skins/result-paper@2x.png";

import { ChoiceTicket } from "../ChoiceTicket";
import { ContinueButton } from "../ContinueButton";
import { EndingTitle } from "../EndingTitle";
import { FeedbackPaper } from "../FeedbackPaper";
import { FinalStats } from "../FinalStats";
import { NextEventPreview } from "../NextEventPreview";
import { PaperHeader, type PaperHeaderProps } from "../PaperHeader";
import { PersonaTag } from "../PersonaTag";
import { PrintIcon } from "../PrintIcon";
import { ResultActions } from "../ResultActions";
import { ResultFolder } from "../ResultFolder";
import { StatCard } from "../StatCard";
import type { ChoiceViewModel, EventViewModel, ResultViewModel, StatViewModel, StatKind } from "../visualTypes";

type SkinChoiceTone = "green" | "yellow" | "rust";

interface SkinPaperHeaderProps extends PaperHeaderProps {}

export function SkinPaperHeader(props: SkinPaperHeaderProps) {
  return (
    <div className="ms-cskin-paper-header">
      <img className="ms-cskin-paper-header__base" src={headerPaper} alt="" aria-hidden="true" />
      <img className="ms-cskin-paper-header__left-tab" src={headerLeftTab} alt="" aria-hidden="true" />
      <img className="ms-cskin-paper-header__tape" src={headerTape} alt="" aria-hidden="true" />
      <PaperHeader {...props} />
    </div>
  );
}

interface SkinStatCardProps {
  kind: StatKind;
  label: string;
  value: number;
  delta?: number;
}

export function SkinStatCard(props: SkinStatCardProps) {
  return (
    <div className="ms-cskin-stat-card">
      <img src={statCardPaper} alt="" aria-hidden="true" />
      <StatCard {...props} />
    </div>
  );
}

function getChoiceTicketAsset(tone: SkinChoiceTone) {
  if (tone === "yellow") {
    return choiceTicketYellow;
  }

  if (tone === "rust") {
    return choiceTicketRed;
  }

  return choiceTicketGreen;
}

interface SkinChoiceTicketProps {
  choice: ChoiceViewModel;
  index: number;
  onChoose?: (choice: ChoiceViewModel) => void;
  tone?: SkinChoiceTone;
}

export function SkinChoiceTicket({ choice, index, onChoose, tone = "green" }: SkinChoiceTicketProps) {
  return (
    <div className={`ms-cskin-choice-ticket ms-cskin-choice-ticket--${tone}`}>
      <img src={getChoiceTicketAsset(tone)} alt="" aria-hidden="true" />
      <ChoiceTicket choice={choice} index={index} onChoose={onChoose} />
    </div>
  );
}

interface SkinFeedbackCardProps {
  selectedChoice: ChoiceViewModel;
}

export function SkinFeedbackCard({ selectedChoice }: SkinFeedbackCardProps) {
  return (
    <div className="ms-cskin-feedback-card">
      <img src={feedbackCard} alt="" aria-hidden="true" />
      <FeedbackPaper selectedChoice={selectedChoice} />
    </div>
  );
}

interface SkinNextEventCardProps {
  event?: EventViewModel;
}

export function SkinNextEventCard({ event }: SkinNextEventCardProps) {
  return (
    <div className="ms-cskin-next-event-card">
      <img src={nextEventCard} alt="" aria-hidden="true" />
      <NextEventPreview event={event} />
    </div>
  );
}

interface SkinResultPaperProps {
  result: ResultViewModel;
  stats: StatViewModel[];
  onRestart?: () => void;
  onShare?: () => void;
  shareStatus?: "copied" | "failed" | "idle";
}

export function SkinResultPaper({ result, stats, onRestart, onShare, shareStatus = "idle" }: SkinResultPaperProps) {
  return (
    <div className="ms-cskin-result-paper">
      <img className="ms-cskin-result-paper__base" src={resultPaper} alt="" aria-hidden="true" />
      <ResultFolder>
        <EndingTitle result={result} />
        <FinalStats stats={stats} />
        <PersonaTag result={result} />
        <ResultActions onRestart={onRestart} onShare={onShare} shareStatus={shareStatus} />
      </ResultFolder>
    </div>
  );
}

interface SkinPrimaryButtonProps {
  onContinue?: () => void;
}

export function SkinPrimaryButton({ onContinue }: SkinPrimaryButtonProps) {
  return (
    <div className="ms-cskin-primary-button">
      <img src={primaryButton} alt="" aria-hidden="true" />
      <ContinueButton onContinue={onContinue} />
    </div>
  );
}

interface SkinSecondaryButtonProps {
  onShare?: () => void;
}

export function SkinSecondaryButton({ onShare }: SkinSecondaryButtonProps) {
  return (
    <div className="ms-cskin-secondary-button">
      <img src={secondaryButton} alt="" aria-hidden="true" />
      <button className="ms-secondary-action" type="button" onClick={onShare}>
        <PrintIcon name="download" />
        <span>保存结果图</span>
      </button>
    </div>
  );
}
