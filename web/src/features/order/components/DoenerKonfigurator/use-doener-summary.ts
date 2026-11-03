import { konfiguratorCopy } from "../../copy";
import { VEGGIES } from "../../konfigurator";
import { useKonfiguratorContext } from "./konfigurator-context";
import { useFunnyLine } from "./use-funny-line";

export interface DoenerSummary {
  meat: string;
  veggies: string;
  sauces: string;
  quip: string;
}

// Human-readable summary of the configured Döner plus a playful verdict.
export const useDoenerSummary = (): DoenerSummary => {
  const { meat, meatOptions, sauces, sauceOptions, veggies } = useKonfiguratorContext();

  const meatLabel = meatOptions.find((option) => option.key === meat)?.label ?? "—";
  const chosenVeggies = VEGGIES.filter((veggie) => veggies[veggie.key] === true);
  const sauceLabels = sauceOptions
    .filter((option) => sauces.includes(option.key))
    .map((option) => option.label);

  let veggieText = chosenVeggies.map((veggie) => veggie.label).join(", ");
  if (chosenVeggies.length === VEGGIES.length) {
    veggieText = konfiguratorCopy.allVeggies;
  } else if (chosenVeggies.length === 0) {
    veggieText = konfiguratorCopy.noVeggies;
  }

  let quips: readonly string[] = konfiguratorCopy.quipDefault;
  if (sauceLabels.length === 0) {
    quips = konfiguratorCopy.quipDry;
  } else if (chosenVeggies.length === 0) {
    quips = konfiguratorCopy.quipMeatOnly;
  } else if (sauceLabels.length >= 3) {
    quips = konfiguratorCopy.quipAllSauces;
  }
  const quip = useFunnyLine(quips);

  return {
    meat: meatLabel,
    veggies: veggieText,
    sauces: sauceLabels.length === 0 ? konfiguratorCopy.noSauce : sauceLabels.join(", "),
    quip,
  };
};
