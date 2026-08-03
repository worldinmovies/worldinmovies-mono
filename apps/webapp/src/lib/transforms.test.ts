import { describe, it, expect } from "vitest";
import { transferDiscoverMovie } from "@/lib/transforms";
import type { DiscoverMovie } from "@/lib/models";
import seedData from "../../../../tests/e2e/seed/seed-data.json";

// The API serves raw Mongo documents — the seed shape is the real runtime
// contract (note: it has NO imdb_vote_average/rating fields, which the
// transform must tolerate).
const seeds = seedData as unknown as DiscoverMovie[];

describe("transferDiscoverMovie (real E2E seed contract)", () => {
  it("maps every seed DiscoveryMovie doc without throwing", () => {
    const mapped = seeds.map((doc) => transferDiscoverMovie(doc));
    expect(mapped.length).toBe(seedData.length);

    for (const m of mapped) {
      expect(m).toBeDefined();
      expect(m.title).toBeTruthy();
      expect(typeof m.country).toBe("string");
      expect(m.country.length).toBeGreaterThan(0);
      expect(Array.isArray(m.genres)).toBe(true);
      expect(typeof m.id).toBe("number");
    }
  });

  it("does not throw for malformed or empty country codes", () => {
    const base = seeds[0];
    for (const badCode of ["", " ", "us", "xx", undefined]) {
      const m = transferDiscoverMovie({ ...base, estimated_country: badCode });
      expect(typeof m.country).toBe("string");
      expect(m.country.length).toBeGreaterThan(0);
    }
  });
});
