const cqlLibraryElm_withFunction = {
  library: {
    localId: "0",
    statements: {
      def: [
        {
          localId: "2231",
          locator: "259:1-264:3",
          resultTypeName: "{urn:hl7-org:elm-types:r1}Boolean",
          name: "isVerified",
          context: "Patient",
          accessLevel: "Public",
          fluent: true,
          type: "FunctionDef",
          operand: [
            {
              localId: "2238",
              name: "condition",
              operandTypeSpecifier: {
                localId: "2234",
                locator: "259:45-259:126",
                type: "ChoiceTypeSpecifier",
                resultTypeSpecifier: {
                  localId: "2235",
                  type: "ChoiceTypeSpecifier",
                  choice: [
                    {
                      localId: "2236",
                      name: "{http://hl7.org/fhir}Condition",
                      type: "NamedTypeSpecifier",
                    },
                    {
                      localId: "2237",
                      name: "{http://hl7.org/fhir}Condition",
                      type: "NamedTypeSpecifier",
                    },
                  ],
                },
                choice: [
                  {
                    localId: "2232",
                    locator: "259:52-259:89",
                    resultTypeName: "{http://hl7.org/fhir}Condition",
                    name: "{http://hl7.org/fhir}Condition",
                    type: "NamedTypeSpecifier",
                  },
                  {
                    localId: "2233",
                    locator: "259:92-259:125",
                    resultTypeName: "{http://hl7.org/fhir}Condition",
                    name: "{http://hl7.org/fhir}Condition",
                    type: "NamedTypeSpecifier",
                  },
                ],
              },
            },
          ],
        },
        {
          localId: "2615",
          locator: "273:1-276:15",
          resultTypeName: "{urn:hl7-org:elm-types:r1}Integer",
          name: "Measure Observation 1",
          context: "Patient",
          accessLevel: "Public",
          type: "FunctionDef",
          operand: [
            {
              localId: "2617",
              name: "MalnutritionRiskScreening",
              operandTypeSpecifier: {
                localId: "2616",
                locator: "273:67-273:75",
                resultTypeName: "{http://hl7.org/fhir}Encounter",
                name: "{http://hl7.org/fhir}Encounter",
                type: "NamedTypeSpecifier",
              },
            },
          ],
        },
        {
          localId: "3051",
          locator: "353:1-356:32",
          name: "IsNotRejected",
          context: "Patient",
          accessLevel: "Public",
          type: "FunctionDef",
          resultTypeSpecifier: {
            localId: "3135",
            type: "ListTypeSpecifier",
            elementType: {
              localId: "3136",
              name: "{http://hl7.org/fhir}Task",
              type: "NamedTypeSpecifier",
            },
          },
          operand: [],
        },
        {
          localId: "1111",
          locator: "333:1-333:15",
          resultTypeName: "{urn:hl7-org:elm-types:r1}Integer",
          name: "test non function",
          context: "Patient",
          accessLevel: "Public",
          type: "NoneFunctionDef",
        },
      ],
    },
  },
};

export { cqlLibraryElm_withFunction };
