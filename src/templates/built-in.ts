import type { PDFTemplate } from '../types';

export const BUILT_IN_TEMPLATES: PDFTemplate[] = [
  {
    id: 'german-donation-receipt1',
    name: '우리교회 헌금 영수증',
    description: 'created on 20260219',
    page: {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
    customFieldDefaults: {
      signatureLocation: 'Kelsterbach',
      taxNumber1: 'Frankfurt/Main StNr. 14 255 72251',
      taxDate1: '23.12.2025',
      taxNumber2: 'Frankfurt/Main StNr. 4525057301',
      taxDate2: '29.04.2011',
      taxValidFrom: '27.12.2016'
    },
    sections: [
      // Organization header (Aussteller) with border box
      {
        type: 'box',
        x: 15,
        y: 15,
        width: 180,
        height: 20,  // Increased for 4 lines of text
        border: true,
        borderColor: '#000000',  // or any color
        borderWidth: 0.3,
        sections: [
          {
            type: 'textBlock',
            content: 'Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)\nKoreanische Kirchengemeinde URI e. V.\nOberhöchstädter Weg 7\n65760 Eschborn',
            x: 2,  // Relative to box
            y: 4,  // Relative to box
            width: 180,
            align: 'left',
            fontSize: 11,
          }
        ]
      },
      // Title
      {
        type: 'textBlock',
        content: 'Bestätigung über Geldzuwendungen/Mitgliedsbeitrag',
        x: 105,
        y: 44,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 14,
      },
      // Legal text about § 10b
      {
        type: 'textBlock',
        content: 'Im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen',
        x: 15,
        y: 52,
        width: 180,
        fontSize: 9,
      },
      // Donor section with boundary box
      {
        type: 'box',
        x: 15,
        y: 60,
        width: 180,
        height: 22,
        border: true,
        borderColor: '#000000',
        borderWidth: 0.3,
        sections: [
          {
            type: 'textBlock',
            content: 'Name und Anschrift des Zuwendenden:',
            x: 2,  // Offset from box left
            y: 4,  // Offset from box top
            width: 176,
            bold: true,
            fontSize: 10,
          },
          {
            type: 'textBlock',
            content: '{{customFields.donorName}}',
            x: 2,
            y: 12,  // Second line position
            width: 176,
            bold: true,
            fontSize: 11,
          },
          {
            type: 'textBlock',
            content: '{{customFields.donorAddress}}',
            x: 2,
            y: 18,  // Third line position
            width: 176,
            fontSize: 10,
          }
        ]
      },
      // Amount information table with 3 columns, 1 row
      {
        type: 'customDataTable',
        x: 15,
        y: 85,  // Absolute Y position
        headers: ['Betrag der Zuwendung in Ziffern', 'in Buchstaben', 'Tag der Zuwendung'],
        rows: [
          [
            'EUR {{customFields.amount}}',
            '{{customFields.amountInWords}}',
            '{{customFields.donationPeriod}}'
          ],
        ],
        options: {
          showHeaders: true,
          repeatHeader: false,
          gridLines: true,
          borderWidth: 0.3,
          borderColor: '#000000',
          headerBackgroundColor: '#ffffff',
          headerTextColor: '#000000',
          alternateRowColors: false,
          alternateRowColor1: '#ffffff',
          alternateRowColor2: '#ffffff',
          fontSize: 9,
          cellPadding: 3,
          align: 'center',  // Center align all columns
        },
        substituteVariables: true,
      },
      // Verzicht section - single line with text and checkboxes
      {
        type: 'textBlock',
        content: 'Es handelt sich um den Verzicht auf Erstattung von Aufwendungen.',
        x: 15,
        y: 122,
        width: 180,
        bold: true,
        fontSize: 9,
      },
      // Ja checkbox - positioned on same line
      {
        type: 'checkbox',
        label: 'Ja',
        checked: '{{customFields.verzichtJa}}',
        x: 135,  // Positioned after text (15 + ~130 for text width)
        y: 121,  // Same y as text for same line
        fontSize: 9,
        boxSize: 4,
        labelGap: 2,
      },
      // Nein checkbox - positioned after Ja
      {
        type: 'checkbox',
        label: 'Nein',
        checked: '{{customFields.verzichtNein}}',
        x: 160,  // Positioned after Ja checkbox
        y: 121,  // Same y as text for same line
        fontSize: 9,
        boxSize: 4,
        labelGap: 2,
      },
      // Divider line 1
      {
        type: 'divider',
        x: 15,
        y: 133,
        width: 180,
        color: '#000000',
        lineWidth: 0.1,
        style: 'solid',
      },
      // Steuerbegünstigung header
      {
        type: 'textBlock',
        content: 'Steuerbegünstigung',
        x: 15,
        y: 142,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // First tax exemption option (Freistellungsbescheid)
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung (Angabe des begünstigten Zwecks / der begünstigten Zwecke) nach dem letzten uns zugegangenen Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes {{customFields.taxNumber1}}, vom {{customFields.taxDate1}} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.',
        checked: '{{customFields.taxExemptionOption}}',
        x: 15,
        y: 152,
        fontSize: 8,
        boxSize: 4,
        group: 'taxExemption',
        groupValue: 'freistellungsbescheid',
      },
      // Second tax exemption option (vorläufige Bescheinigung) - checked by default
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung gemeinnütziger Zwecke (Religion §52 Abs.2 Satz 1 Nr. 2 AO) durch vorläufige Bescheinigung des Finanzamtes {{customFields.taxNumber2}}, vom {{customFields.taxDate2}} ab {{customFields.taxValidFrom}} als steuerbegünstigten Zwecken dienend anerkannt.',
        checked: '{{customFields.taxExemptionOption}}',
        x: 15,
        y: 175,
        fontSize: 8,
        boxSize: 4,
        group: 'taxExemption',
        groupValue: 'vorlaeufigeBescheinigung',
      },
      // Confirmation about fund usage
      {
        type: 'textBlock',
        content: 'Es wird bestätigt, dass die Zuwendung nur zur Förderung (gemeinnütziger Zwecke) Religion § 52 Abs. 2 Satz 1 Nr. 2 Abgabenordnung verwendet wird.',
        x: 15,
        y: 195,
        width: 180,
        bold: true,
        fontSize: 8,
      },
      // Membership contribution checkbox
      {
        type: 'checkbox',
        label: 'Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag i.S.v § 10b Abs. 1 Satz 2 Einkommensteuergesetzes handelt.',
        checked: '{{customFields.notMembership}}',
        x: 15,
        y: 210,
        fontSize: 8,
        boxSize: 4,
      },
      // Divider line 2
      {
        type: 'divider',
        x: 15,
        y: 220,
        width: 180,
        color: '#000000',
        lineWidth: 0.1,
        style: 'solid',
      },
      // Signature section
      {
        type: 'textBlock',
        content: '{{customFields.signatureLocation}}, {{customFields.issueDate}}',
        // content: 'Kelsterbach, {{customFields.issueDate}}',

        x: 15,
        y: 243,
        width: 100,
        bold: true,
        fontSize: 10,
      },
      // Divider line 3
      {
        type: 'divider',
        x: 15,
        y: 245,
        width: 180,
        color: '#000000',
        lineWidth: 0.5,
        style: 'solid',
      },
      {
        type: 'textBlock',
        content: 'Ort, Datum und Unterschrift des Zuwendungsempfängers',
        x: 15,
        y: 249,
        width: 180,
        fontSize: 8,
      },
      // Hinweis header
      {
        type: 'textBlock',
        content: 'Hinweis',
        x: 15,
        y: 265,
        width: 180,
        bold: true,
        fontSize: 10,
      },
      // Legal notice
      {
        type: 'textBlock',
        content: 'Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung erstellt oder wer veranlasst, dass Zuwendungen nicht zu den in der Zuwendungsbestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die Steuer, die dem Fiskus durch einen etwaigen Abzug der Zuwendungen beim Zuwendenden entgeht (§ 10 b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG).',
        x: 15,
        y: 270,
        width: 180,
        fontSize: 7,
      },
      // Additional notice
      {
        type: 'textBlock',
        content: 'Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als 5 Jahre bzw. das Datum der vorläufigen Bescheinigung länger als 3 Jahre seit Ausstellung der Bestätigung zurückliegt (BMF vom 15.12.1994 - BStBl I S. 884).',
        x: 15,
        y: 280,
        width: 180,
        fontSize: 7,
      },
      // Page break for second page (Anhang)
      {
        type: 'pageBreak',
      },
      // Page 2: Anhang zur Bestätigung
      // Organization header (Aussteller)
      {
        type: 'textBlock',
        content: 'Koreanische Kirchengemeinde URI e. V.\nOberhöchstädter Weg 7\n65760 Eschborn',
        x: 105,
        y: 20,
        width: 180,
        align: 'center',
        fontSize: 11,
      },
      {
        type: 'textBlock',
        content: 'Anhang zur Bestätigung über Geldzuwendung/Spendequittung',
        x: 105,
        y: 42,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 14,
      },
      {
        type: 'textBlock',
        content: 'Aufstellung der Einzelzuwendungen',
        x: 105,
        y: 52,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 12,
      },
      // Spacer to advance Y position for table
      {
        type: 'spacer',
        height: 45,
      },
      // Monthly breakdown table with custom data
      {
        type: 'customDataTable',
        headers: ['Datum', 'Betrag (EUR)', 'Art'],
        rows: [
          ['Jan.', 'EUR {{customFields.jan}}', 'Spende'],
          ['Feb.', 'EUR {{customFields.feb}}', '"'],
          ['Mär.', 'EUR {{customFields.mar}}', '"'],
          ['Apr.', 'EUR {{customFields.apr}}', '"'],
          ['Mai.', 'EUR {{customFields.may}}', '"'],
          ['Jun.', 'EUR {{customFields.jun}}', '"'],
          ['Jul.', 'EUR {{customFields.jul}}', '"'],
          ['Aug.', 'EUR {{customFields.aug}}', '"'],
          ['Sep.', 'EUR {{customFields.sep}}', '"'],
          ['Okt.', 'EUR {{customFields.oct}}', '"'],
          ['Nov.', 'EUR {{customFields.nov}}', '"'],
          ['Dez.', 'EUR {{customFields.dec}}', '"'],
          ['Gesamtsumme', 'EUR {{customFields.amount}}', '(siehe Sammelbestätigung)'],
        ],
        options: {
          showHeaders: true,
          repeatHeader: false,
          gridLines: true,
          borderWidth: 0.2,
          borderColor: '#000000',
          headerBackgroundColor: '#ffffff',
          headerTextColor: '#000000',
          alternateRowColors: false,
          alternateRowColor1: '#ffffff',
          alternateRowColor2: '#ffffff',
          fontSize: 10,
          cellPadding: 3,
        },
        substituteVariables: true,
      }
    ],
  },
  {
    id: 'german-donation-receipt2',
    name: '주안에우리교회 헌금 영수증',
    description: 'created on 20260219',
    page: {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
    customFieldDefaults: {
      signatureLocation: 'Sulzbach am Taunus',
      taxNumber1: 'Frankfurt/Main StNr. xxxx',
      taxDate1: 'dd.mm.yyyy',
      taxNumber2: 'Frankfurt/Main StNr. yyyy',
      taxDate2: 'dd.mm.yyyy',
      taxValidFrom: 'dd.mm.yyyy'
    },
    sections: [
      // Organization header (Aussteller) with border box
      {
        type: 'box',
        x: 15,
        y: 15,
        width: 180,
        height: 20,  // Increased for 4 lines of text
        border: true,
        borderColor: '#000000',  // or any color
        borderWidth: 0.3,
        sections: [
          {
            type: 'textBlock',
            content: 'Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)\nKoreanische Kirchengemeinde Juane-Uri e. V.\nPlatz a. d. Linde 6\n65843 Sulzbach (Taunus)',
            x: 2,  // Relative to box
            y: 4,  // Relative to box
            width: 180,
            align: 'left',
            fontSize: 11,
          }
        ]
      },
      // Title
      {
        type: 'textBlock',
        content: 'Bestätigung über Geldzuwendungen/Mitgliedsbeitrag',
        x: 105,
        y: 44,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 14,
      },
      // Legal text about § 10b
      {
        type: 'textBlock',
        content: 'Im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen',
        x: 15,
        y: 52,
        width: 180,
        fontSize: 9,
      },
      // Donor section with boundary box
      {
        type: 'box',
        x: 15,
        y: 60,
        width: 180,
        height: 22,
        border: true,
        borderColor: '#000000',
        borderWidth: 0.3,
        sections: [
          {
            type: 'textBlock',
            content: 'Name und Anschrift des Zuwendenden:',
            x: 2,  // Offset from box left
            y: 4,  // Offset from box top
            width: 176,
            bold: true,
            fontSize: 10,
          },
          {
            type: 'textBlock',
            content: '{{customFields.donorName}}',
            x: 2,
            y: 12,  // Second line position
            width: 176,
            bold: true,
            fontSize: 11,
          },
          {
            type: 'textBlock',
            content: '{{customFields.donorAddress}}',
            x: 2,
            y: 18,  // Third line position
            width: 176,
            fontSize: 10,
          }
        ]
      },
      // Amount information table with 3 columns, 1 row
      {
        type: 'customDataTable',
        x: 15,
        y: 85,  // Absolute Y position
        headers: ['Betrag der Zuwendung in Ziffern', 'in Buchstaben', 'Tag der Zuwendung'],
        rows: [
          [
            'EUR {{customFields.amount}}',
            '{{customFields.amountInWords}}',
            '{{customFields.donationPeriod}}'
          ],
        ],
        options: {
          showHeaders: true,
          repeatHeader: false,
          gridLines: true,
          borderWidth: 0.3,
          borderColor: '#000000',
          headerBackgroundColor: '#ffffff',
          headerTextColor: '#000000',
          alternateRowColors: false,
          alternateRowColor1: '#ffffff',
          alternateRowColor2: '#ffffff',
          fontSize: 9,
          cellPadding: 3,
          align: 'center',  // Center align all columns
        },
        substituteVariables: true,
      },
      // Verzicht section - single line with text and checkboxes
      {
        type: 'textBlock',
        content: 'Es handelt sich um den Verzicht auf Erstattung von Aufwendungen.',
        x: 15,
        y: 122,
        width: 180,
        bold: true,
        fontSize: 9,
      },
      // Ja checkbox - positioned on same line
      {
        type: 'checkbox',
        label: 'Ja',
        checked: '{{customFields.verzichtJa}}',
        x: 135,  // Positioned after text (15 + ~130 for text width)
        y: 121,  // Same y as text for same line
        fontSize: 9,
        boxSize: 4,
        labelGap: 2,
      },
      // Nein checkbox - positioned after Ja
      {
        type: 'checkbox',
        label: 'Nein',
        checked: '{{customFields.verzichtNein}}',
        x: 160,  // Positioned after Ja checkbox
        y: 121,  // Same y as text for same line
        fontSize: 9,
        boxSize: 4,
        labelGap: 2,
      },
      // Divider line 1
      {
        type: 'divider',
        x: 15,
        y: 133,
        width: 180,
        color: '#000000',
        lineWidth: 0.1,
        style: 'solid',
      },
      // Steuerbegünstigung header
      {
        type: 'textBlock',
        content: 'Steuerbegünstigung',
        x: 15,
        y: 142,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // First tax exemption option (Freistellungsbescheid)
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung (Angabe des begünstigten Zwecks / der begünstigten Zwecke) nach dem letzten uns zugegangenen Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes {{customFields.taxNumber1}}, vom {{customFields.taxDate1}} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.',
        checked: '{{customFields.taxExemptionOption}}',
        x: 15,
        y: 152,
        fontSize: 8,
        boxSize: 4,
        group: 'taxExemption',
        groupValue: 'freistellungsbescheid',
      },
      // Second tax exemption option (vorläufige Bescheinigung) - checked by default
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung gemeinnütziger Zwecke (Religion §52 Abs.2 Satz 1 Nr. 2 AO) durch vorläufige Bescheinigung des Finanzamtes {{customFields.taxNumber2}}, vom {{customFields.taxDate2}} ab {{customFields.taxValidFrom}} als steuerbegünstigten Zwecken dienend anerkannt.',
        checked: '{{customFields.taxExemptionOption}}',
        x: 15,
        y: 175,
        fontSize: 8,
        boxSize: 4,
        group: 'taxExemption',
        groupValue: 'vorlaeufigeBescheinigung',
      },
      // Confirmation about fund usage
      {
        type: 'textBlock',
        content: 'Es wird bestätigt, dass die Zuwendung nur zur Förderung (gemeinnütziger Zwecke) Religion § 52 Abs. 2 Satz 1 Nr. 2 Abgabenordnung verwendet wird.',
        x: 15,
        y: 195,
        width: 180,
        bold: true,
        fontSize: 8,
      },
      // Membership contribution checkbox
      {
        type: 'checkbox',
        label: 'Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag i.S.v § 10b Abs. 1 Satz 2 Einkommensteuergesetzes handelt.',
        checked: '{{customFields.notMembership}}',
        x: 15,
        y: 210,
        fontSize: 8,
        boxSize: 4,
      },
      // Divider line 2
      {
        type: 'divider',
        x: 15,
        y: 220,
        width: 180,
        color: '#000000',
        lineWidth: 0.1,
        style: 'solid',
      },
      // Signature section
      {
        type: 'textBlock',
        content: '{{customFields.signatureLocation}}, {{customFields.issueDate}}',

        x: 15,
        y: 243,
        width: 100,
        bold: true,
        fontSize: 10,
      },
      // Divider line 3
      {
        type: 'divider',
        x: 15,
        y: 245,
        width: 180,
        color: '#000000',
        lineWidth: 0.5,
        style: 'solid',
      },
      {
        type: 'textBlock',
        content: 'Ort, Datum und Unterschrift des Zuwendungsempfängers',
        x: 15,
        y: 249,
        width: 180,
        fontSize: 8,
      },
      // Hinweis header
      {
        type: 'textBlock',
        content: 'Hinweis',
        x: 15,
        y: 265,
        width: 180,
        bold: true,
        fontSize: 10,
      },
      // Legal notice
      {
        type: 'textBlock',
        content: 'Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung erstellt oder wer veranlasst, dass Zuwendungen nicht zu den in der Zuwendungsbestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die Steuer, die dem Fiskus durch einen etwaigen Abzug der Zuwendungen beim Zuwendenden entgeht (§ 10 b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG).',
        x: 15,
        y: 270,
        width: 180,
        fontSize: 7,
      },
      // Additional notice
      {
        type: 'textBlock',
        content: 'Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als 5 Jahre bzw. das Datum der vorläufigen Bescheinigung länger als 3 Jahre seit Ausstellung der Bestätigung zurückliegt (BMF vom 15.12.1994 - BStBl I S. 884).',
        x: 15,
        y: 280,
        width: 180,
        fontSize: 7,
      },
      // Page break for second page (Anhang)
      {
        type: 'pageBreak',
      },
      // Page 2: Anhang zur Bestätigung
      // Organization header (Aussteller)
      {
        type: 'textBlock',
        content: 'Koreanische Kirchengemeinde Juane-Uri e. V.\nPlatz a. d. Linde 6\n65843 Sulzbach (Taunus)',
        x: 105,
        y: 20,
        width: 180,
        align: 'center',
        fontSize: 11,
      },
      {
        type: 'textBlock',
        content: 'Anhang zur Bestätigung über Geldzuwendung/Spendequittung',
        x: 105,
        y: 42,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 14,
      },
      {
        type: 'textBlock',
        content: 'Aufstellung der Einzelzuwendungen',
        x: 105,
        y: 52,
        width: 180,
        align: 'center',
        bold: true,
        fontSize: 12,
      },
      // Spacer to advance Y position for table
      {
        type: 'spacer',
        height: 45,
      },
      // Monthly breakdown table with custom data
      {
        type: 'customDataTable',
        headers: ['Datum', 'Betrag (EUR)', 'Art'],
        rows: [
          ['Jan.', 'EUR {{customFields.jan}}', 'Spende'],
          ['Feb.', 'EUR {{customFields.feb}}', '"'],
          ['Mär.', 'EUR {{customFields.mar}}', '"'],
          ['Apr.', 'EUR {{customFields.apr}}', '"'],
          ['Mai.', 'EUR {{customFields.may}}', '"'],
          ['Jun.', 'EUR {{customFields.jun}}', '"'],
          ['Jul.', 'EUR {{customFields.jul}}', '"'],
          ['Aug.', 'EUR {{customFields.aug}}', '"'],
          ['Sep.', 'EUR {{customFields.sep}}', '"'],
          ['Okt.', 'EUR {{customFields.oct}}', '"'],
          ['Nov.', 'EUR {{customFields.nov}}', '"'],
          ['Dez.', 'EUR {{customFields.dec}}', '"'],
          ['Gesamtsumme', 'EUR {{customFields.amount}}', '(siehe Sammelbestätigung)'],
        ],
        options: {
          showHeaders: true,
          repeatHeader: false,
          gridLines: true,
          borderWidth: 0.2,
          borderColor: '#000000',
          headerBackgroundColor: '#ffffff',
          headerTextColor: '#000000',
          alternateRowColors: false,
          alternateRowColor1: '#ffffff',
          alternateRowColor2: '#ffffff',
          fontSize: 10,
          cellPadding: 3,
        },
        substituteVariables: true,
      }
    ],
  }
];
