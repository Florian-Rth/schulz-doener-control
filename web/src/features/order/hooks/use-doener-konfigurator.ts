import { useState } from "react";
import {
  type DoenerBuild,
  mergeExtraText,
  parseVeggieDecisions,
  type VeggieDecisions,
} from "@/components";
import {
  findTextField,
  MEAT_FIELD_KEY,
  SAUCE_FIELD_KEY,
  VEGGIES,
  type Veggie,
} from "../konfigurator";
import { useOrderFormContext } from "../order-context";
import type { Field, FieldOption } from "../types";

export type KonfiguratorStep =
  | { kind: "meat" }
  | { kind: "veggie"; veggie: Veggie }
  | { kind: "sauce" }
  | { kind: "done" };

const STEPS: readonly KonfiguratorStep[] = [
  { kind: "meat" },
  ...VEGGIES.map((veggie): KonfiguratorStep => ({ kind: "veggie", veggie })),
  { kind: "sauce" },
  { kind: "done" },
];

const SAUCE_STEP_INDEX = STEPS.findIndex((step) => step.kind === "sauce");
const DONE_STEP_INDEX = STEPS.length - 1;

export interface UseDoenerKonfiguratorResult {
  step: KonfiguratorStep;
  stepIndex: number;
  stepCount: number;
  meatOptions: FieldOption[];
  sauceOptions: FieldOption[];
  meat: string | null;
  sauces: string[];
  veggies: VeggieDecisions;
  build: DoenerBuild;
  /** True on the final step — the scene switches to turntable mode. */
  isPresenting: boolean;
  canGoBack: boolean;
  pickMeat: (optionKey: string) => void;
  decideVeggie: (wanted: boolean) => void;
  /** "Mit allem": every veggie in, jump straight to the sauces. */
  takeEverything: () => void;
  toggleSauce: (optionKey: string) => void;
  next: () => void;
  back: () => void;
  restart: () => void;
  /** Writes meat, sauces and the Gemüse text into the order line and closes. */
  apply: () => void;
}

interface UseDoenerKonfiguratorArgs {
  index: number;
  onClose: () => void;
}

interface KonfiguratorState {
  stepIndex: number;
  meat: string | null;
  sauces: string[];
  veggies: VeggieDecisions;
}

const EMPTY_STATE: KonfiguratorState = { stepIndex: 0, meat: null, sauces: [], veggies: {} };

const fieldByKey = (fields: readonly Field[], key: string): Field | undefined =>
  fields.find((field) => field.key === key);

// Logic layer of the configurator: a step machine over meat → each veggie →
// sauces → presentation. Seeded from the line's current answers, so reopening
// it on an already configured Döner shows that Döner on the turntable.
export const useDoenerKonfigurator = ({
  index,
  onClose,
}: UseDoenerKonfiguratorArgs): UseDoenerKonfiguratorResult => {
  const { form, menu, setAnswer } = useOrderFormContext();

  const productId = form.getValues(`lines.${index}.productId`);
  const item = menu.items.find((entry) => entry.id === productId);
  const category = menu.categories.find((entry) => entry.key === item?.categoryKey);
  const fields = category?.fields ?? [];
  const meatOptions = fieldByKey(fields, MEAT_FIELD_KEY)?.options ?? [];
  const sauceOptions = fieldByKey(fields, SAUCE_FIELD_KEY)?.options ?? [];
  const textField = findTextField(fields);

  const [state, setState] = useState<KonfiguratorState>(() => {
    const answers = form.getValues(`lines.${index}.answers`);
    const meat = answers[MEAT_FIELD_KEY]?.options?.[0] ?? null;
    if (meat === null) {
      return EMPTY_STATE;
    }
    const text = textField === undefined ? "" : (answers[textField.key]?.text ?? "");
    return {
      stepIndex: DONE_STEP_INDEX,
      meat,
      sauces: answers[SAUCE_FIELD_KEY]?.options ?? [],
      veggies: parseVeggieDecisions(text),
    };
  });

  const goTo = (stepIndex: number): void => {
    setState((current) => ({
      ...current,
      stepIndex: Math.min(Math.max(stepIndex, 0), DONE_STEP_INDEX),
    }));
  };

  const step = STEPS[state.stepIndex] ?? { kind: "done" };

  const pickMeat = (optionKey: string): void => {
    setState((current) => ({ ...current, meat: optionKey, stepIndex: current.stepIndex + 1 }));
  };

  const decideVeggie = (wanted: boolean): void => {
    if (step.kind !== "veggie") {
      return;
    }
    const key = step.veggie.key;
    setState((current) => ({
      ...current,
      veggies: { ...current.veggies, [key]: wanted },
      stepIndex: current.stepIndex + 1,
    }));
  };

  const takeEverything = (): void => {
    const all: VeggieDecisions = {};
    for (const veggie of VEGGIES) {
      all[veggie.key] = true;
    }
    setState((current) => ({ ...current, veggies: all, stepIndex: SAUCE_STEP_INDEX }));
  };

  const toggleSauce = (optionKey: string): void => {
    setState((current) => ({
      ...current,
      sauces: current.sauces.includes(optionKey)
        ? current.sauces.filter((entry) => entry !== optionKey)
        : [...current.sauces, optionKey],
    }));
  };

  const apply = (): void => {
    if (state.meat !== null) {
      setAnswer(index, MEAT_FIELD_KEY, { options: [state.meat] });
    }
    // Keep the menu's sauce order so the line detail reads the same as the chips.
    const sauces = sauceOptions
      .map((option) => option.key)
      .filter((key) => state.sauces.includes(key));
    setAnswer(index, SAUCE_FIELD_KEY, { options: sauces });
    if (textField !== undefined) {
      const current = form.getValues(`lines.${index}.answers.${textField.key}`)?.text ?? "";
      setAnswer(index, textField.key, { text: mergeExtraText(current, state.veggies) });
    }
    onClose();
  };

  return {
    step,
    stepIndex: state.stepIndex,
    stepCount: STEPS.length,
    meatOptions,
    sauceOptions,
    meat: state.meat,
    sauces: state.sauces,
    veggies: state.veggies,
    build: {
      meat: state.meat,
      veggies: VEGGIES.filter((veggie) => state.veggies[veggie.key] === true).map(
        (veggie) => veggie.key,
      ),
      sauces: state.sauces,
    },
    isPresenting: step.kind === "done",
    canGoBack: state.stepIndex > 0,
    pickMeat,
    decideVeggie,
    takeEverything,
    toggleSauce,
    next: () => {
      goTo(state.stepIndex + 1);
    },
    back: () => {
      goTo(state.stepIndex - 1);
    },
    restart: () => {
      setState(EMPTY_STATE);
    },
    apply,
  };
};
