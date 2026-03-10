import {
  AUFBAU_OPTIONS,
  type AufbauOptionKey
} from "@/components/protocol/ZubehoerAufbauSection";
import {
  SCHRAENKE_OPTIONS,
  type SchraenkeOptionKey
} from "@/components/protocol/ZubehoerSchraenkeSection";
import { type SchuettblendeOptionKey } from "@/components/protocol/ZubehoerSchuettblendeSection";

describe("zubehoer public type exports", () => {
  test("keeps legacy option and option key exports available from section modules", () => {
    const aufbauKey: AufbauOptionKey = "uml";
    const schuettblendeKey: SchuettblendeOptionKey = "aussen";
    const schraenkeKey: SchraenkeOptionKey = "kleiderschrank";

    expect(aufbauKey).toBe("uml");
    expect(schuettblendeKey).toBe("aussen");
    expect(schraenkeKey).toBe("kleiderschrank");
    expect(AUFBAU_OPTIONS.find((option) => option.id === "uml")?.label).toBe("UML");
    expect(SCHRAENKE_OPTIONS.find((option) => option.id === "kleiderschrank")?.label).toBe(
      "Kleiderschrank"
    );
  });
});
