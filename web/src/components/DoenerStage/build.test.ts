import { describe, expect, it } from "vitest";
import { buildFromAnswers, mergeExtraText, ownNotesOf, parseVeggieDecisions } from "./build";

describe("parseVeggieDecisions", () => {
  it("treats everything as drauf unless the text says ohne", () => {
    expect(parseVeggieDecisions("Ohne Zwiebeln, ohne tomaten, Soße separat")).toEqual({
      salat: true,
      tomate: false,
      gurke: true,
      zwiebeln: false,
      rotkohl: true,
    });
  });
});

describe("mergeExtraText", () => {
  it("writes ohne-tokens and keeps the colleague's own notes", () => {
    expect(mergeExtraText("Soße separat", { zwiebeln: false, salat: true })).toBe(
      "ohne Zwiebeln, Soße separat",
    );
  });

  it("replaces earlier tokens instead of stacking them", () => {
    expect(mergeExtraText("ohne Zwiebeln, Soße separat", { rotkohl: false })).toBe(
      "ohne Rotkohl, Soße separat",
    );
  });

  it("writes mit allem when nothing is left out", () => {
    expect(mergeExtraText("mit allem, extra scharf", {})).toBe("mit allem, extra scharf");
    expect(mergeExtraText("", {})).toBe("mit allem");
  });
});

describe("buildFromAnswers", () => {
  it("rebuilds the Döner an order describes", () => {
    expect(
      buildFromAnswers({ meat: "kalb", sauces: ["scharf"], text: "ohne Gurken, Soße separat" }),
    ).toEqual({
      meat: "kalb",
      veggies: ["salat", "tomate", "zwiebeln", "rotkohl"],
      sauces: ["scharf"],
    });
  });

  it("reads the server's ' · '-joined description too", () => {
    expect(
      buildFromAnswers({ meat: null, sauces: [], text: "Kalb · Scharf · ohne Zwiebeln" }).veggies,
    ).not.toContain("zwiebeln");
  });
});

describe("ownNotesOf", () => {
  it("drops the protocol tokens", () => {
    expect(ownNotesOf("ohne Zwiebeln, Soße separat")).toEqual(["Soße separat"]);
  });
});
