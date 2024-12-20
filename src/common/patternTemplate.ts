export const PATTERN_TEMPLATE = 
// `<?xml version="1.0" encoding="UTF-8"?>
// <?xml-model href="http://www.music-encoding.org/schema/3.0.0/mei-all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
// <?xml-model href="http://www.music-encoding.org/schema/3.0.0/mei-all.rng" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>
`<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="3.0.0" xmlns:query="http://www.matangover.com/musicquery">
    <meiHead/>
    <music>
        <body>
            <mdiv>
                <score>
                    <scoreDef>
                        <staffGrp>
                            <staffDef n="1" lines="5" clef.line="2" clef.shape="G"/>
                        </staffGrp>
                    </scoreDef>
                    <section>
                        <measure n="0">
                            <staff n="1">
                                <layer n="1">
                                    PATTERN
                                </layer>
                            </staff>
                        </measure>
                    </section>
                </score>
            </mdiv>
        </body>
    </music>
</mei>`;