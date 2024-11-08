# symsic

Musicologists and musicians often need to search for patterns in musical scores as part of their research. Currently, searching in symbolic music is either not user-friendly or not powerful enough. For example, the musical search engine Musipedia only offers limited search options, while the music21 Python library requires researchers to have programming knowledge. 

We propose a new system (called SymSic, short for Symbolic Music) for querying symbolic music that provides advanced search options in a friendly user interface which autocompletes as the user uses their keyboard to enter notes. The system will allow users to build declarative queries over both pitch and rhythm patterns and execute those queries on large collections of scores. The system will support Humdrum **kern, a widely-used symbolic music format, allowing researchers to immediately start using the tool.

A key innovation of our system will be an inverted index for symbolic music. This index allows users to quickly receive autocompletion results while they are entering a query.

We adapted code from [MusicQuery](https://github.com/matangover/musicquery/) to translate MEI search inputs into regular expressions.

## Development

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
