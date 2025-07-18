import { useEffect } from "react";
import useDialogue from "../../composables/useDialogue";
import { useGameState } from "../../composables/useGameState";
import { handleDialogue, type daimonDialogueType } from "../../daimons";
import BloodButton from "../bloodButton/bloodButton";
import DialogueBox from "./dialogueBox";
import { revealSchema } from "../../utils/revealSchema";

export default function DialogueManager() {
  const { gameState, gameDispatch } = useGameState();
  const { phase, daimon, hand, visibility } = gameState;
  const isDialoguePhase = phase === "intro-dialogue"
    || phase === "hand-dialogue"
    || phase === "end-dialogue";

  if (!isDialoguePhase) return;

  //Only triggered in dialogue game phases
  const daimonDialogue = handleDialogue({
    phase: phase,
    daimon: daimon,
    hand: hand,
  });
  const dialogue = useDialogue(daimonDialogue, () => advancePhase());
  const { index, currentLine, advance, reset } = dialogue;
  const opacityDelay = 300;

  const revealObj: {
    dialogueBox: number;
    daimon: number;
    table: number;
    healthBars: number;
  } = revealSchema(daimon);
  
  const visibilityMap = Object.fromEntries(
    Object
      .entries(revealObj)
      .map(([key, threshold]) => [
        key,
        index >= threshold
      ])
  );

  useEffect(() => {
    if (!daimonDialogue) return;

    const timer = setTimeout(() => {
      gameDispatch({ type: "SET_VISIBILITY",
        payload: {
          ...visibility,
          dialogueBox: true
      }})
    }, opacityDelay);

    return () => clearTimeout(timer);
  }, []);

  //Makes items appear per dialogue queues
  useEffect(() => {
    if (phase !== "intro-dialogue") return;
    if (index !== 0) {
      gameDispatch({ type: "SET_VISIBILITY",
        payload: visibilityMap
    })};
  }, [index]);

  useEffect(() => {
    if (!daimonDialogue) {
      advancePhase();
    }
  }, []);

  if (!currentLine) return;

  function advancePhase() {
    const nextPhase: { [key in keyof daimonDialogueType]: string } = {
      "intro-dialogue": "wager",
      "hand-dialogue": "player-turn",
      "end-dialogue": "intermission"
    };

    gameDispatch({ type: "SET_PHASE",
      payload: {
        phase: nextPhase[phase as keyof daimonDialogueType]
    }});

    reset();
  };

  return (
    <>
      <DialogueBox
        isVisible={ visibility.dialogueBox }
        line={ currentLine }
      />
      <div
        className="intro-button-container transition-opacity"
        style={{
          position: "absolute",
          bottom: "5%",
          right: "2%",
          zIndex: "1",
          opacity: visibility.dialogueBox? "1" : "0"
        }}
      >
        <BloodButton
          action={ advance }
        >
          Next
        </BloodButton>
      </div>
    </>
  )
};