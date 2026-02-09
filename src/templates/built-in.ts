import type { PDFTemplate } from '../types';

export const BUILT_IN_TEMPLATES: PDFTemplate[] = [
  {
    id: 'german-donation-receipt1',
    name: '우리교회 헌금 영수증',
    description: 'created on 20260207',
    page: {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
    customFieldDefaults: {
      signatureLocation: 'Kelsterbach',
    },
    sections: [
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
      // Title
      {
        type: 'textBlock',
        content: 'Bestätigung über Geldzuwendungen/Mitgliedsbeitrag',
        x: 105,
        y: 42,
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
      // Donor section header
      {
        type: 'textBlock',
        content: 'Name und Anschrift des Zuwendenden:',
        x: 15,
        y: 62,
        width: 180,
        bold: true,
        fontSize: 10,
      },
      // Donor name
      {
        type: 'textBlock',
        content: '{{customFields.donorName}}',
        x: 15,
        y: 70,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // Donor address
      {
        type: 'textBlock',
        content: '{{customFields.donorAddress}}',
        x: 15,
        y: 76,
        width: 180,
        fontSize: 10,
      },
      // Amount table header
      {
        type: 'labeledField',
        label: 'Betrag der Zuwendung in Ziffern',
        value: 'EUR {{customFields.amount}}',
        x: 15,
        y: 90,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Amount in words
      {
        type: 'labeledField',
        label: 'in Buchstaben',
        value: '{{customFields.amountInWords}}',
        x: 15,
        y: 100,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Date range
      {
        type: 'labeledField',
        label: 'Tag der Zuwendung',
        value: '{{customFields.donationPeriod}}',
        x: 15,
        y: 110,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Verzicht section
      {
        type: 'textBlock',
        content: 'Es handelt sich um den Verzicht auf Erstattung von Aufwendungen.',
        x: 15,
        y: 122,
        width: 180,
        bold: true,
        fontSize: 9,
      },
      // Ja checkbox
      {
        type: 'checkbox',
        label: 'Ja',
        checked: '{{customFields.verzichtJa}}',
        x: 15,
        y: 132,
        fontSize: 10,
        boxSize: 8,
      },
      // Nein checkbox
      {
        type: 'checkbox',
        label: 'Nein',
        checked: '{{customFields.verzichtNein}}',
        x: 35,
        y: 132,
        fontSize: 10,
        boxSize: 8,
      },
      // Divider line 1
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 142,
        width: 180,
        fontSize: 8,
      },
      // Steuerbegünstigung header
      {
        type: 'textBlock',
        content: 'Steuerbegünstigung',
        x: 15,
        y: 152,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // First tax exemption option (Freistellungsbescheid)
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung (Angabe des begünstigten Zwecks / der begünstigten Zwecke) nach dem letzten uns zugegangenen Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes, StNr. {{customFields.taxNumber1}}, vom {{customFields.taxDate1}} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.',
        checked: '{{customFields.taxOption1}}',
        x: 15,
        y: 162,
        fontSize: 8,
        boxSize: 8,
      },
      // Second tax exemption option (vorläufige Bescheinigung) - checked by default
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung gemeinnütziger Zwecke (Religion §52 Abs.2 Satz 1 Nr. 2 AO) durch vorläufige Bescheinigung des Finanzamtes Frankfurt/Main StNr. {{customFields.taxNumber2}}, vom {{customFields.taxDate2}} ab {{customFields.taxValidFrom}} als steuerbegünstigten Zwecken dienend anerkannt.',
        checked: '{{customFields.taxOption2}}',
        x: 15,
        y: 185,
        fontSize: 8,
        boxSize: 8,
      },
      // Confirmation about fund usage
      {
        type: 'textBlock',
        content: 'Es wird bestätigt, dass die Zuwendung nur zur Förderung (gemeinnütziger Zwecke) Religion § 52 Abs. 2 Satz 1 Nr. 2 Abgabenordnung verwendet wird.',
        x: 15,
        y: 205,
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
        y: 220,
        fontSize: 8,
        boxSize: 8,
      },
      // Divider line 2
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 233,
        width: 180,
        fontSize: 8,
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
      {
        type: 'textBlock',
        content: 'Ort, Datum und Unterschrift des Zuwendungsempfängers',
        x: 15,
        y: 249,
        width: 180,
        fontSize: 8,
      },
      // Divider line 3
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 259,
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
    description: 'created on 20260209',
    page: {
      orientation: 'portrait',
      format: 'a4',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
    customFieldDefaults: {
      signatureLocation: 'Sulzbach am Taunus',
    },
    sections: [
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
      // Title
      {
        type: 'textBlock',
        content: 'Bestätigung über Geldzuwendungen/Mitgliedsbeitrag',
        x: 105,
        y: 42,
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
      // Donor section header
      {
        type: 'textBlock',
        content: 'Name und Anschrift des Zuwendenden:',
        x: 15,
        y: 62,
        width: 180,
        bold: true,
        fontSize: 10,
      },
      // Donor name
      {
        type: 'textBlock',
        content: '{{customFields.donorName}}',
        x: 15,
        y: 70,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // Donor address
      {
        type: 'textBlock',
        content: '{{customFields.donorAddress}}',
        x: 15,
        y: 76,
        width: 180,
        fontSize: 10,
      },
      // Amount table header
      {
        type: 'labeledField',
        label: 'Betrag der Zuwendung in Ziffern',
        value: 'EUR {{customFields.amount}}',
        x: 15,
        y: 90,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Amount in words
      {
        type: 'labeledField',
        label: 'in Buchstaben',
        value: '{{customFields.amountInWords}}',
        x: 15,
        y: 100,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Date range
      {
        type: 'labeledField',
        label: 'Tag der Zuwendung',
        value: '{{customFields.donationPeriod}}',
        x: 15,
        y: 110,
        fontSize: 10,
        boldLabel: true,
        separator: ' ',
      },
      // Verzicht section
      {
        type: 'textBlock',
        content: 'Es handelt sich um den Verzicht auf Erstattung von Aufwendungen.',
        x: 15,
        y: 122,
        width: 180,
        bold: true,
        fontSize: 9,
      },
      // Ja checkbox
      {
        type: 'checkbox',
        label: 'Ja',
        checked: '{{customFields.verzichtJa}}',
        x: 15,
        y: 132,
        fontSize: 10,
        boxSize: 8,
      },
      // Nein checkbox
      {
        type: 'checkbox',
        label: 'Nein',
        checked: '{{customFields.verzichtNein}}',
        x: 35,
        y: 132,
        fontSize: 10,
        boxSize: 8,
      },
      // Divider line 1
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 142,
        width: 180,
        fontSize: 8,
      },
      // Steuerbegünstigung header
      {
        type: 'textBlock',
        content: 'Steuerbegünstigung',
        x: 15,
        y: 152,
        width: 180,
        bold: true,
        fontSize: 11,
      },
      // First tax exemption option (Freistellungsbescheid)
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung (Angabe des begünstigten Zwecks / der begünstigten Zwecke) nach dem letzten uns zugegangenen Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes, StNr. {{customFields.taxNumber1}}, vom {{customFields.taxDate1}} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.',
        checked: '{{customFields.taxOption1}}',
        x: 15,
        y: 162,
        fontSize: 8,
        boxSize: 8,
      },
      // Second tax exemption option (vorläufige Bescheinigung) - checked by default
      {
        type: 'checkbox',
        label: 'Wir sind wegen Förderung gemeinnütziger Zwecke (Religion §52 Abs.2 Satz 1 Nr. 2 AO) durch vorläufige Bescheinigung des Finanzamtes Frankfurt/Main StNr. {{customFields.taxNumber2}}, vom {{customFields.taxDate2}} ab {{customFields.taxValidFrom}} als steuerbegünstigten Zwecken dienend anerkannt.',
        checked: '{{customFields.taxOption2}}',
        x: 15,
        y: 185,
        fontSize: 8,
        boxSize: 8,
      },
      // Confirmation about fund usage
      {
        type: 'textBlock',
        content: 'Es wird bestätigt, dass die Zuwendung nur zur Förderung (gemeinnütziger Zwecke) Religion § 52 Abs. 2 Satz 1 Nr. 2 Abgabenordnung verwendet wird.',
        x: 15,
        y: 205,
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
        y: 220,
        fontSize: 8,
        boxSize: 8,
      },
      // Divider line 2
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 233,
        width: 180,
        fontSize: 8,
      },
      // Signature section
      {
        type: 'textBlock',
        content: '{{customFields.signatureLocation}}, {{customFields.issueDate}}',
        // content: 'Sulzbach am Taunus, {{customFields.issueDate}}',
        x: 15,
        y: 243,
        width: 100,
        bold: true,
        fontSize: 10,
      },
      {
        type: 'textBlock',
        content: 'Ort, Datum und Unterschrift des Zuwendungsempfängers',
        x: 15,
        y: 249,
        width: 180,
        fontSize: 8,
      },
      // Divider line 3
      {
        type: 'textBlock',
        content: '______________________________________________',
        x: 15,
        y: 259,
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
