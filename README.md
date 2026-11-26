# La Biblioteca Biblica

Gioco di ordinamento a squadre per gruppi dai 14 ai 15 anni. Apri `index.html` nel browser del computer o servi questa cartella come sito statico per provarlo da smartphone e tablet. Il gioco funziona anche offline una volta aperti i file nel browser. Non servono account o backend.

## Come si gioca

1. Scegli un nome di fantasia per la squadra e inizia dal Pentateuco. I livelli si aprono in sequenza. Ogni raccolta si apre quando hai concluso tutti i livelli della precedente.
2. Tocca un titolo e poi una posizione. Per scambiare due libri sullo scaffale, toccali uno dopo l’altro. Se dal vassoio scegli una posizione piena, il libro sostituito torna disponibile.
3. Quando lo scaffale è pieno, tocca **Verifica**. Il gioco mostra il numero di posizioni corrette e mette una spunta accanto ai libri già al posto giusto. Lasciate fermi quei libri, riordinate gli altri e verificate di nuovo. Le spunte restano sulle posizioni confermate finché non vengono spostati i rispettivi libri. **Rimescola** svuota lo scaffale e conserva tempo e verifiche del tentativo.
4. La soluzione vale 3 stelle alla prima verifica, 2 alla seconda e 1 dalla terza in poi. Ogni soluzione apre il livello successivo della raccolta. Il cronometro misura il tempo di gioco a livello aperto e pagina visibile. Si ferma al completamento o quando si apre una finestra del gioco.
5. Dopo la soluzione puoi proseguire o rigiocare. Il risultato ufficiale è quello con meno verifiche. A parità di verifiche i risultati sono equivalenti e il record già salvato resta valido. Il cronometro dà un’informazione sul tempo di gioco. Nel finale le verifiche dei migliori risultati e le verifiche aggiuntive sono riportate a parte. Le verifiche aggiuntive provengono dai tentativi e dalle rivincite esclusi dai migliori risultati. Il tempo di gioco include tutti i tentativi.

## Salvataggi

Il gioco conserva le partite per squadra nel browser. Il pulsante con il nome della squadra apre l’elenco delle partite salvate e permette di crearne una nuova. Usando lo stesso browser e lo stesso indirizzo, puoi riprendere l’ultimo scaffale aperto.

Al primo avvio della modalità con le spunte, il gioco conserva i nomi salvati delle squadre e azzera i salvataggi delle versioni precedenti su quel browser e indirizzo. Le nuove partite iniziano dal Pentateuco.

## Contenuti

I 73 libri seguono l’[indice della Bibbia CEI 2008](https://www.bibbiaedu.it/CEI2008/audio/). Le posizioni 1–73 indicano la successione nell’edizione, che raggruppa i libri in raccolte. La data degli avvenimenti o della scrittura segue una cronologia distinta.

| Raccolta | Libri | Dimensioni dei livelli |
| --- | ---: | --- |
| Pentateuco | 5 | 5 |
| Libri storici | 16 | 5 + 6 + 5 |
| Libri sapienziali e poetici | 7 | 7 |
| Libri profetici | 18 | 6 + 6 + 6 |
| Vangeli e Atti | 5 | 5 |
| Lettere e Apocalisse | 22 | 7 + 7 + 8 |

## File

- `biblioteca.js` contiene i titoli e i livelli.
- `progressi.js` gestisce migrazione, punteggi e salvataggio locale.
- `gioco.js` gestisce partita, cronometro, navigazione e schermate dei risultati.
- `index.html` e `stile.css` definiscono l’interfaccia.
- `.nojekyll` permette a GitHub Pages di servire direttamente i file.

La versione con le spunte è pronta per il collaudo e la successiva pubblicazione su GitHub Pages.
