import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, sameName, winnerIds, type Guess } from "./game.ts";

const g = (id: string, gender: "boy" | "girl", babyName: string): Guess => ({
  id, gender, babyName, guesserName: id, createdAt: "",
});

test("sameName ignores case, accents and spaces", () => {
  assert.ok(sameName(" Zoë ", "zoe"));
  assert.ok(!sameName("", ""));
  assert.ok(!sameName("Noor", "Nora"));
});

test("both right wins", () => {
  const w = winnerIds([g("a", "girl", "Noor"), g("b", "girl", "Lina"), g("c", "boy", "Noor")], { gender: "girl", name: "noor" });
  assert.deepEqual([...w], ["a"]);
});

test("nobody has the name: gender right wins", () => {
  const w = winnerIds([g("a", "girl", "Lina"), g("b", "boy", "Noor"), g("c", "girl", "Mila")], { gender: "girl", name: "Noor" });
  assert.deepEqual([...w].sort(), ["a", "c"]);
});

test("no reveal, no winners", () => {
  assert.equal(winnerIds([g("a", "boy", "Lou")], null).size, 0);
});

test("clean trims, collapses and limits", () => {
  assert.equal(clean("  Tom \n  en   Sara ", 40), "Tom en Sara");
  assert.equal(clean("x".repeat(50), 40).length, 40);
});
