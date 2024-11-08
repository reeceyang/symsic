import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { kernScores } from "@/server/db/schema";
import { sql } from "drizzle-orm";
import * as cheerio from "cheerio";
import { type AnyNode } from "domhandler";
import { PATTERN_TEMPLATE } from "patternTemplate";

const getPattern = (patternContent: string) => {
  const fullPattern = PATTERN_TEMPLATE.replace("PATTERN", patternContent);
  return convertToMEI(fullPattern);
};

const convertToMEI = (patternText: string) => {
  const $ = cheerio.load(patternText, { xml: true });
  const pattern = $(patternText);
  pattern.find("note").each(function (index, _note) {
    const note = $(_note);
    if (note.attr("query:any-duration") === "true") {
      note.attr("stem.visible", "false");
      if (note.attr("dur") === undefined) {
        note.attr("dur", "4");
      }
    }
    if (note.attr("query:any-pitch") === "true") {
      note.attr("artic", "ten");
      if (note.attr("pname") === undefined && note.attr("oct") === undefined) {
        note.attr("pname", "c");
        note.attr("oct", "5");
      }
    }
    if (note.attr("query:any-accidental") === "true") {
      note.attr("accid", "1qs");
    }
  });
  pattern.find("query\\:or").each(function (index, _or) {
    const or = $(_or);
    const orNote = $(
      '<note type="or" pname="f" dur="4" oct="4" stem.len="6" />',
    );
    or.replaceWith(orNote);
  });
  pattern.find("query\\:group").each(function (index, _group) {
    const group = $(_group);
    const tuplet = $('<tuplet num="1" numbase="1" num.format="ratio" />');
    //  bracket.visible="false"
    tuplet.attr("xml:id", "group" + index);
    tuplet.append(group.children());
    const min = group.attr("min-occurrences");
    const max = group.attr("max-occurrences");
    if (min === undefined && max === undefined) {
      tuplet.attr("num.visible", "false");
    } else {
      tuplet.attr("type", "quantifier");
      const quantifier = (() => {
        if (min === "0" && max === "1") {
          return "?";
        } else if (min === "1" && max === undefined) {
          return "+";
        } else {
          if (!(min === "0" && max === undefined)) {
            console.log(
              "Quantifiers {" +
                min +
                ", " +
                max +
                "} not supported." +
                'Using "zero or more" instead.',
            );
          }
          return "*";
        }
      })();
      tuplet.attr("quantifier", quantifier);
    }
    tuplet.attr("bracket.visible", group.attr("bracket.visible"));
    group.replaceWith(tuplet);
  });
  if (pattern[0] === undefined) {
    throw new Error("Pattern is empty.");
  }
  return pattern[0];
};

const meiToRegex = (input: string) => {
  const meiText = getPattern(input);
  const $ = cheerio.load(meiText, { xml: true });
  const meiPattern = $(meiText);
  const layer = meiPattern.find(
    "music body mdiv score section measure staff layer",
  );
  if (layer.length != 1) {
    // TODO: should this be an error?
    throw new Error("Found " + layer.length + " layers instead of 1.");
  }
  const regex = getRegexForChildren(layer);
  return regex;
};

const getRegexForChildren = (element: cheerio.Cheerio<AnyNode>) => {
  let regex = "";
  element.children().each(function (index, el) {
    const $ = cheerio.load(el, { xml: true });
    const tagProp = $(el).prop("tagName");
    if (tagProp === undefined) {
      throw new Error("tagName prop is undefined.");
    }
    const tag = tagProp.toLowerCase();
    const getRegexForTag = getRegexFor[tag];
    if (getRegexForTag === undefined) {
      throw new Error("No regex function for tag: " + tag);
    }
    regex += getRegexForTag($(el));
  });
  return regex;
};

const RECORD_START = "(^|\\t)";
// Skip lines starting with:
//  . - null record.
//  ! - comment.
//  * - interpretation / tandem interpretation
//  = - barline
// Use non-greedy operator (*?) so that rows are only captured if necessary to
// satisfy the pattern.
const OPTIONAL_SKIPPED_LINES = "(^[!.*=].*\n)*?";
const OPTIONAL_SLUR_START = "(&?{)?(&?\\()?\\[?";
const ANY_ACCIDENTAL = "(#+|-+|n)?";
const getRegexFor: Record<
  string,
  (element: cheerio.Cheerio<AnyNode>) => string
> = {
  beam: getRegexForChildren,
  note: (element) => {
    if (element.attr("type") == "or") {
      return getRegexForOr();
    }
    const duration = getNoteDuration(element);
    const pitch = getNotePitch(element);
    // https://musiccog.ohio-state.edu/Humdrum/representations/kern.html#Context%20Dependencies
    return (
      RECORD_START +
      OPTIONAL_SLUR_START +
      duration +
      pitch +
      ".*\n" +
      OPTIONAL_SKIPPED_LINES
    );
  },
  tuplet: (element) => {
    // TODO: Handle actual tuplets (those not signifying grouping).
    const childrenRegex = getRegexForChildren(element);
    const quantifier = element.attr("quantifier") ?? "";
    return "(" + childrenRegex + ")" + quantifier;
  },
  space: () => "",
};

function getNoteDuration(element: cheerio.Cheerio<AnyNode>) {
  if (element.attr("stem.visible") == "false") {
    // Allow any duration - query specifies pitch only.
    // https://musiccog.ohio-state.edu/Humdrum/representations/kern.html#Duration
    return "[0-9]+\\.*";
  } else {
    // http://music-encoding.org/guidelines/v3/data-types/data.duration.cmn.html
    const meiDuration = element.attr("dur");
    const dotsAttr = element.attr("dots") ?? "";
    // default to 0
    const dotCount = parseInt(dotsAttr) || 0;
    const dots = "\\.".repeat(dotCount);
    return meiDuration + dots;
  }
}

function getNotePitch(element: cheerio.Cheerio<AnyNode>) {
  const { pitchName, accidental } = (() => {
    // https://musiccog.ohio-state.edu/Humdrum/representations/kern.html#Pitch
    if (element.attr("artic") == "ten") {
      // Allow any pitch - query specifies duration only.
      return { pitchName: "([a-g]+|[A-G]+)", accidental: ANY_ACCIDENTAL };
    } else {
      const octAttr = element.attr("oct") ?? "";
      // default to 4
      const oct = parseInt(octAttr) ?? 4;
      const meiPitchName = element.attr("pname");
      if (meiPitchName === undefined) {
        throw new Error("pname attribute is undefined.");
      }
      const pitchName = (() => {
        if (oct >= 4) {
          return meiPitchName.repeat(oct - 3);
        } else {
          return meiPitchName.toUpperCase().repeat(4 - oct);
        }
      })();
      const meiAccidental = element.attr("accid") ?? "";
      const accidental = (() => {
        if (meiAccidental == "1qs") {
          return ANY_ACCIDENTAL;
        } else {
          // http://music-encoding.org/guidelines/v3/data-types/data.accidental.explicit.html
          return meiAccidental
            .replace("n", "")
            .replace("s", "#")
            .replace("f", "-")
            .replace("x", "##");
        }
      })();
      return { pitchName, accidental };
    }
  })();
  // Ensure we're matching the whole note by adding a negative lookahead.
  return pitchName + accidental + "(?![a-gA-G#\\-n])";
}

const getRegexForOr = () => "|";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ meiText: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const regex = meiToRegex(input.meiText).replace(/\n/g, "");
      console.log(regex);

      const scores = await ctx.db
        .select()
        .from(kernScores)
        .where(sql`${kernScores.kernData} ~ ${regex}`);

      return scores;
    }),
});
