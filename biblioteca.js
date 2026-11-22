"use strict";

// Titoli brevi e successione dell'indice CEI 2008.
// Fonte: https://www.bibbiaedu.it/CEI2008/audio/
const antico = "Antico Testamento";
const nuovo = "Nuovo Testamento";
const raccolte = [
  ["pentateuco", "Pentateuco", antico, [
    [
      ["Gen", "Genesi"], ["Es", "Esodo"], ["Lv", "Levitico"],
      ["Nm", "Numeri"], ["Dt", "Deuteronomio", "Deutero|nomio"],
    ],
  ]],
  ["storici", "Libri storici", antico, [
    [
      ["Gs", "Giosuè"], ["Gdc", "Giudici"], ["Rt", "Rut"],
      ["1Sam", "1 Samuele"], ["2Sam", "2 Samuele"],
    ],
    [
      ["1Re", "1 Re"], ["2Re", "2 Re"], ["1Cr", "1 Cronache"],
      ["2Cr", "2 Cronache"], ["Esd", "Esdra"], ["Ne", "Neemia"],
    ],
    [
      ["Tb", "Tobia"], ["Gdt", "Giuditta"], ["Est", "Ester"],
      ["1Mac", "1 Maccabei"], ["2Mac", "2 Maccabei"],
    ],
  ]],
  ["sapienziali", "Libri sapienziali e poetici", antico, [
    [
      ["Gb", "Giobbe"], ["Sal", "Salmi"], ["Pr", "Proverbi"], ["Qo", "Qoelet"],
      ["Ct", "Cantico dei Cantici"], ["Sap", "Sapienza"], ["Sir", "Siracide"],
    ],
  ]],
  ["profetici", "Libri profetici", antico, [
    [
      ["Is", "Isaia"], ["Ger", "Geremia"], ["Lam", "Lamentazioni", "Lamenta|zioni"],
      ["Bar", "Baruc"], ["Ez", "Ezechiele"], ["Dn", "Daniele"],
    ],
    [
      ["Os", "Osea"], ["Gl", "Gioele"], ["Am", "Amos"],
      ["Abd", "Abdia"], ["Gio", "Giona"], ["Mi", "Michea"],
    ],
    [
      ["Na", "Naum"], ["Ab", "Abacuc"], ["Sof", "Sofonia"],
      ["Ag", "Aggeo"], ["Zc", "Zaccaria"], ["Ml", "Malachia"],
    ],
  ]],
  ["vangeli", "Vangeli e Atti", nuovo, [
    [
      ["Mt", "Matteo"], ["Mc", "Marco"], ["Lc", "Luca"],
      ["Gv", "Giovanni"], ["At", "Atti degli Apostoli"],
    ],
  ]],
  ["lettere", "Lettere e Apocalisse", nuovo, [
    [
      ["Rm", "Romani"], ["1Cor", "1 Corinzi"], ["2Cor", "2 Corinzi"], ["Gal", "Gàlati"],
      ["Ef", "Efesini"], ["Fil", "Filippesi"], ["Col", "Colossesi"],
    ],
    [
      ["1Ts", "1 Tessalonicesi", "1 Tessa|lonicesi"], ["2Ts", "2 Tessalonicesi", "2 Tessa|lonicesi"],
      ["1Tm", "1 Timòteo"], ["2Tm", "2 Timòteo"], ["Tt", "Tito"],
      ["Fm", "Filèmone"], ["Eb", "Ebrei"],
    ],
    [
      ["Gc", "Giacomo"], ["1Pt", "1 Pietro"], ["2Pt", "2 Pietro"],
      ["1Gv", "1 Giovanni"], ["2Gv", "2 Giovanni"], ["3Gv", "3 Giovanni"],
      ["Gd", "Giuda"], ["Ap", "Apocalisse"],
    ],
  ]],
];

let posizioneCanonica = 0;
const biblioteca = raccolte.map(([id, titolo, testamento, gruppi]) => {
  const livelli = gruppi.map((gruppo, indice) => ({
    id: `${id}-${indice + 1}`,
    numero: indice + 1,
    sezione: id,
    libri: gruppo.map(([codice, nome, sillabe]) => ({
      id: codice, titolo: nome, sillabe, numero: ++posizioneCanonica,
    })),
  }));
  return { id, titolo, testamento, livelli, totale: livelli.reduce((totale, livello) => totale + livello.libri.length, 0) };
});
