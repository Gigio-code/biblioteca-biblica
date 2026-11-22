# La Biblioteca Biblica

Gioco per gruppi dai 14 ai 15 anni. Apri `index.html` nel browser del computer o servi questa cartella come sito statico per provarlo da smartphone e tablet. Il gioco funziona anche offline una volta aperti i file nel browser. Non servono installazioni, account o backend.

## Come si gioca

1. Apri **La biblioteca** e scegli una delle sei raccolte. Il primo livello di ciascuna è disponibile da subito. Gli altri si aprono in sequenza.
2. Tocca un titolo e poi una posizione. In verticale sul telefono i titoli sono sopra lo scaffale, che mantiene la sequenza numerata. Per scambiare due libri sullo scaffale, toccali uno dopo l’altro. Se da vassoio scegli una posizione piena, il libro sostituito torna disponibile.
3. Con tutti i libri in posizione, tocca **Verifica**. Il risultato mostra quante posizioni sono corrette e quali rivedere. Sposta i libri e verifica di nuovo.
4. Un livello entra nella mappa quando è risolto. La sezione è completa quando hai concluso tutti i suoi livelli. **Indice della sezione** mostra i libri già sistemati e le fasce di posizioni ancora da completare.
5. **Ricomincia** rimescola soltanto il livello aperto. Il gioco conserva i completamenti e salva anche le partite in corso nel browser. Il salvataggio dipende dal browser e dall’indirizzo usato per aprire l’app.

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

## File e pubblicazione

- `biblioteca.js` contiene i 73 titoli e la suddivisione in livelli.
- `progressi.js` legge, valida e salva lo stato del gioco in `localStorage`.
- `gioco.js` gestisce la partita, la navigazione e l’avanzamento.
- `index.html` e `stile.css` definiscono l’interfaccia.

Questa versione è per il collaudo. Il sito è predisposto per GitHub Pages con riferimenti relativi e `.nojekyll`. Per pubblicarlo dopo il collaudo, copia i file in un repository dedicato e attiva Pages sulla radice del branch scelto.
