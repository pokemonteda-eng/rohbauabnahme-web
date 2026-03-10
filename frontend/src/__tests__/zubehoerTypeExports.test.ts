import { type AufbauOptionKey } from "@/components/protocol/ZubehoerAufbauSection";
import { type SchraenkeOptionKey } from "@/components/protocol/ZubehoerSchraenkeSection";
import { type SchuettblendeOptionKey } from "@/components/protocol/ZubehoerSchuettblendeSection";

describe("zubehoer public type exports", () => {
  test("keeps legacy option key exports available from section modules", () => {
    const aufbauKey: AufbauOptionKey = "uml";
    const schuettblendeKey: SchuettblendeOptionKey = "aussen";
    const schraenkeKey: SchraenkeOptionKey = "kleiderschrank";

    expect(aufbauKey).toBe("uml");
    expect(schuettblendeKey).toBe("aussen");
    expect(schraenkeKey).toBe("kleiderschrank");
  });
});
