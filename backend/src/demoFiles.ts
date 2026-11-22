// Example files for the demo data (see demoData.ts): drawings, PDFs, cut lists, 3D models, notes, generated here so
// the repository holds no binary files. Every file is small and opens in the app's preview.

// PDF text uses the standard Helvetica font, which has no Czech letters: they are written without diacritics
const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');
const pdfText = (text: string) => plain(text).replace(/[\\()]/g, (char) => `\\${char}`);

// A one-page A4 PDF: a title, a line under it and the lines of text
export const pdfDocument = (title: string, lines: string[]) => {
    const content = [
        'BT /F2 18 Tf 56 780 Td',
        `(${pdfText(title)}) Tj`,
        'ET',
        '0.8 0.1 0.2 RG 2 w 56 768 m 539 768 l S',
        'BT /F1 11 Tf 56 740 Td 16 TL',
        ...lines.map((line) => `(${pdfText(line)}) '`),
        'ET',
    ].join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return pdf;
};

// A workshop drawing of a plate (mm) with its holes, dimensions and a title block
export const svgDrawing = (title: string, width: number, height: number, holes: number, drawingNumber: string) => {
    const scale = Math.min(500 / width, 260 / height);
    const w = width * scale;
    const h = height * scale;
    const x0 = 70;
    const y0 = 60;
    const hole = Math.max(6, 18 * scale);
    const holeMarks = Array.from({ length: holes }, (_, index) => {
        const cx = x0 + ((index + 1) * w) / (holes + 1);
        return `<circle cx="${cx}" cy="${y0 + h / 2}" r="${hole / 2}" fill="none" stroke="#111" stroke-width="1.5"/>
  <line x1="${cx - hole}" y1="${y0 + h / 2}" x2="${cx + hole}" y2="${y0 + h / 2}" stroke="#c22" stroke-dasharray="6 3"/>`;
    }).join('\n  ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 460" width="680" height="460" font-family="Arial, sans-serif">
  <rect width="680" height="460" fill="#fff"/>
  <rect x="10" y="10" width="660" height="440" fill="none" stroke="#111" stroke-width="2"/>
  <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#eef3f8" stroke="#111" stroke-width="2.5"/>
  ${holeMarks}
  <line x1="${x0}" y1="${y0 + h + 30}" x2="${x0 + w}" y2="${y0 + h + 30}" stroke="#111" marker-start="url(#a)" marker-end="url(#a)"/>
  <text x="${x0 + w / 2}" y="${y0 + h + 24}" text-anchor="middle" font-size="14">${width}</text>
  <line x1="${x0 - 30}" y1="${y0}" x2="${x0 - 30}" y2="${y0 + h}" stroke="#111"/>
  <text x="${x0 - 36}" y="${y0 + h / 2}" text-anchor="middle" font-size="14" transform="rotate(-90 ${x0 - 36} ${y0 + h / 2})">${height}</text>
  <defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><circle cx="4" cy="4" r="2" fill="#111"/></marker></defs>
  <rect x="380" y="370" width="280" height="70" fill="none" stroke="#111"/>
  <line x1="380" y1="395" x2="660" y2="395" stroke="#111"/>
  <text x="390" y="388" font-size="14" font-weight="bold">${title}</text>
  <text x="390" y="414" font-size="11">Výkres č. ${drawingNumber}   Měřítko 1:${Math.round(1 / scale)}</text>
  <text x="390" y="430" font-size="11">Materiál S235JR   Díry ${holes}× Ø18</text>
</svg>
`;
};

// A semicolon-separated table (opens in Excel with Czech settings, and as a table in the preview)
export const csvTable = (header: string[], rows: (string | number)[][]) =>
    [header, ...rows].map((row) => row.map((cell) => (typeof cell === 'number' ? String(cell).replace('.', ',') : cell)).join(';')).join('\n') + '\n';

type Box = [number, number, number, number, number, number]; // x, y, z, width, depth, height (mm)

// An ASCII STL model made of boxes, e.g. a column with flanges and a base plate (the 3D preview shows it)
export const stlModel = (name: string, boxes: Box[]) => {
    const facets: string[] = [];
    for (const [x, y, z, w, d, h] of boxes) {
        const p = (i: number, j: number, k: number) => `${x + i * w} ${y + j * d} ${z + k * h}`;
        const quad = (normal: string, a: string, b: string, c: string, e: string) => {
            for (const [p1, p2, p3] of [
                [a, b, c],
                [a, c, e],
            ]) {
                facets.push(`facet normal ${normal}\n  outer loop\n    vertex ${p1}\n    vertex ${p2}\n    vertex ${p3}\n  endloop\nendfacet`);
            }
        };
        quad('0 0 -1', p(0, 0, 0), p(0, 1, 0), p(1, 1, 0), p(1, 0, 0));
        quad('0 0 1', p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1));
        quad('0 -1 0', p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1));
        quad('0 1 0', p(0, 1, 0), p(0, 1, 1), p(1, 1, 1), p(1, 1, 0));
        quad('-1 0 0', p(0, 0, 0), p(0, 0, 1), p(0, 1, 1), p(0, 1, 0));
        quad('1 0 0', p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1));
    }
    return `solid ${name}\n${facets.join('\n')}\nendsolid ${name}\n`;
};

// an H column (two flanges and a web) standing on a base plate
export const columnModel = (height: number) =>
    stlModel('sloup', [
        [-200, -200, 0, 400, 400, 25],
        [-150, -145, 25, 300, 14, height],
        [-150, 131, 25, 300, 14, height],
        [-5, -131, 25, 10, 262, height],
    ]);

// a straight stair: two stringers and the treads between them
export const stairModel = (steps: number) =>
    stlModel('schodiste', [
        [0, 0, 0, 12, steps * 280, steps * 180 + 200],
        [1000, 0, 0, 12, steps * 280, steps * 180 + 200],
        ...Array.from({ length: steps }, (_, index): Box => [12, index * 280, index * 180 + 150, 988, 270, 30]),
    ]);

// a frame of a gate or a fence panel: the frame and the vertical bars
export const gateModel = (width: number, bars: number) =>
    stlModel('brana', [
        [0, 0, 0, width, 60, 60],
        [0, 0, 1800, width, 60, 60],
        [0, 0, 60, 60, 60, 1740],
        [width - 60, 0, 60, 60, 60, 1740],
        ...Array.from({ length: bars }, (_, index): Box => [((index + 1) * width) / (bars + 1) - 10, 20, 60, 20, 20, 1740]),
    ]);

type DemoFile = { kind: 'INPUT' | 'OUTPUT'; name: string; content: string };
type FileProject = { name: string; customer: string; description: string };
type FileTask = { key: string; name: string; description: string; hours: number };

// the 3D model that fits the project: a stair, a gate or fence, otherwise a column
const projectModel = (project: FileProject) =>
    /schodiště/i.test(project.name) ? stairModel(12) : /brán|plot|oplocen/i.test(project.name) ? gateModel(2500, 9) : columnModel(3000);

// The input files (what the task works from) and output files (what it produces) of a demo task, by its kind
export const demoTaskFiles = (project: FileProject, task: FileTask, index: number): DemoFile[] => {
    const number = `${2026}-${String(index + 101).padStart(3, '0')}`;
    const drawing = (name: string, width: number, height: number, holes: number) => svgDrawing(name, width, height, holes, number);
    const assignment = pdfDocument(`Zadani: ${task.name}`, [
        `Projekt: ${project.name}`,
        `Zakaznik: ${project.customer}`,
        '',
        project.description,
        task.description,
        '',
        `Planovana pracnost: ${task.hours} h`,
        'Dodrzet vykresovou dokumentaci a kontrolni plan.',
    ]);
    const protocol = (title: string, rows: string[]) =>
        pdfDocument(title, [`Projekt: ${project.name}`, `Ukol: ${task.name}`, '', ...rows, '', 'Vysledek: VYHOVUJE', 'Podpis: ____________________']);
    switch (task.key) {
        case 'design':
        case 'static':
            return [
                { kind: 'INPUT', name: 'Zadání zákazníka.pdf', content: assignment },
                { kind: 'OUTPUT', name: `Výkres ${number}.svg`, content: drawing('Patní plech', 400, 400, 4) },
                { kind: 'OUTPUT', name: 'Model konstrukce.stl', content: projectModel(project) },
                {
                    kind: 'OUTPUT',
                    name: 'Statický výpočet.pdf',
                    content: pdfDocument('Staticky vypocet', [
                        `Projekt: ${project.name}`,
                        '',
                        'Zatizeni: stale 0,35 kN/m2, snih 1,0 kN/m2, vitr 0,65 kN/m2',
                        'Material: S235JR, S355J2',
                        'Mezni stav unosnosti: vyuziti 78 %',
                        'Mezni stav pouzitelnosti: pruhyb L/310',
                        '',
                        'Zaver: konstrukce vyhovuje.',
                    ]),
                },
            ];
        case 'drawings':
            return [
                { kind: 'INPUT', name: 'Zadání zákazníka.pdf', content: assignment },
                { kind: 'OUTPUT', name: `Výkres ${number}-A.svg`, content: drawing('Kotevní deska', 300, 200, 2) },
                { kind: 'OUTPUT', name: `Výkres ${number}-B.svg`, content: drawing('Styčníkový plech', 520, 240, 6) },
                {
                    kind: 'OUTPUT',
                    name: 'Kusovník.csv',
                    content: csvTable(
                        ['Pozice', 'Název', 'Materiál', 'Počet', 'Hmotnost kg'],
                        [
                            [1, 'Schodnice UPE 240', 'S355J2', 8, 214.5],
                            [2, 'Stupeň rošt 30/30', 'GRP', 64, 6.2],
                            [3, 'Podesta P10', 'S235JR', 4, 88],
                            [4, 'Kotevní deska 300 × 200', 'S235JR', 16, 9.4],
                            [5, 'Šroub M20 × 80', '8.8', 96, 0.25],
                        ],
                    ),
                },
            ];
        case 'measure':
        case 'survey':
            return [
                {
                    kind: 'OUTPUT',
                    name: 'Zaměření.csv',
                    content: csvTable(
                        ['Bod', 'X mm', 'Y mm', 'Výška mm', 'Poznámka'],
                        Array.from({ length: 12 }, (_, point) => [
                            `B${point + 1}`,
                            point * 6000,
                            (point % 2) * 18000,
                            150 + ((point * 7) % 15),
                            point === 4 ? 'kotva posunutá' : '',
                        ]),
                    ),
                },
                {
                    kind: 'OUTPUT',
                    name: 'Poznámky ze zaměření.txt',
                    content: `Zaměření – ${project.name}\n\n- výšky podlah se liší až o 15 mm\n- kotva B5 je posunutá o 15 mm k ose A\n- přístup pro jeřáb z jižní strany\n- elektro přípojka 400 V u brány\n`,
                },
            ];
        case 'offer':
        case 'order':
            return [
                {
                    kind: 'OUTPUT',
                    name: task.key === 'offer' ? 'Cenová nabídka.pdf' : 'Objednávka.pdf',
                    content: pdfDocument(task.key === 'offer' ? 'Cenova nabidka' : 'Objednavka materialu', [
                        `Odberatel: ${project.customer}`,
                        `Akce: ${project.name}`,
                        '',
                        'Hutni material ......................... 1 240 000 Kc',
                        'Vyroba a povrchove upravy ................ 860 000 Kc',
                        'Montaz a doprava ......................... 410 000 Kc',
                        '',
                        'Celkem bez DPH ......................... 2 510 000 Kc',
                    ]),
                },
                {
                    kind: 'INPUT',
                    name: 'Výkaz materiálu.csv',
                    content: csvTable(
                        ['Materiál', 'Rozměr', 'Množství', 'Jednotka', 'Cena/j. Kč'],
                        [
                            ['HEB 300', '12 m', 18, 'ks', 14200],
                            ['Jekl 80 × 80 × 4', '6 m', 90, 'ks', 1150],
                            ['Plech S235 tl. 10', '1500 × 3000', 24, 'ks', 6900],
                            ['Šroub M20 × 80', '8.8', 800, 'ks', 18.5],
                        ],
                    ),
                },
            ];
        case 'cut':
            return [
                { kind: 'INPUT', name: `Díl ${number}.svg`, content: drawing('Příruba', 360, 240, 4) },
                {
                    kind: 'INPUT',
                    name: 'Výpalový plán.csv',
                    content: csvTable(
                        ['Díl', 'Tloušťka mm', 'Počet', 'Materiál', 'Čas pálení min'],
                        [
                            ['Příruba 360 × 240', 20, 24, 'S355J2', 2.4],
                            ['Výztuha 150 × 150', 10, 96, 'S235JR', 0.6],
                            ['Patní plech 400 × 400', 25, 12, 'S355J2', 3.1],
                        ],
                    ),
                },
                {
                    kind: 'OUTPUT',
                    name: 'Protokol pálení.pdf',
                    content: protocol('Protokol paleni', ['Vypaleno: 132 dilu', 'Odpad: 11 %', 'Rozmerova kontrola: +-0,3 mm']),
                },
            ];
        case 'bend':
            return [
                {
                    kind: 'INPUT',
                    name: 'Tabulka ohybů.csv',
                    content: csvTable(
                        ['Díl', 'Délka mm', 'Úhel °', 'Vnitřní rádius mm', 'Počet'],
                        [
                            ['Lem plechu A', 1500, 90, 6, 14],
                            ['Lem plechu B', 1200, 90, 6, 10],
                            ['Vaznice Z 200', 6000, 87, 4, 48],
                        ],
                    ),
                },
            ];
        case 'machine':
            return [
                { kind: 'INPUT', name: `Konzola ${number}.svg`, content: drawing('Konzola', 300, 200, 2) },
                {
                    kind: 'INPUT',
                    name: 'konzola.nc',
                    content:
                        '%\nO1001 (KONZOLA)\nG21 G90 G17\nT1 M6 (FREZA D16)\nS2400 M3\nG0 X0 Y0 Z5\nG1 Z-2 F300\nG1 X300 F800\nG1 Y200\nG1 X0\nG1 Y0\nG0 Z50\nT2 M6 (VRTAK D18)\nG81 X100 Y100 Z-22 R2 F150\nX200\nG80\nM30\n%\n',
                },
                {
                    kind: 'OUTPUT',
                    name: 'Měřicí protokol.csv',
                    content: csvTable(
                        ['Kus', 'Délka mm', 'Šířka mm', 'Rozteč děr mm', 'Výsledek'],
                        Array.from({ length: 8 }, (_, piece) => [piece + 1, 300 + (piece % 3) / 10, 200 - (piece % 2) / 10, 100, 'OK']),
                    ),
                },
            ];
        case 'paint':
            return [
                {
                    kind: 'INPUT',
                    name: 'Specifikace povrchové úpravy.pdf',
                    content: pdfDocument('Specifikace povrchove upravy', [
                        `Projekt: ${project.name}`,
                        '',
                        'Priprava povrchu: tryskani Sa 2 1/2',
                        'Zinkovani: zarove, min. 85 um',
                        'Praskovy lak: polyester, 80 um, vypal 180 C / 15 min',
                        task.description,
                    ]),
                },
                {
                    kind: 'OUTPUT',
                    name: 'Měření tloušťky vrstvy.csv',
                    content: csvTable(
                        ['Díl', 'Bod 1 µm', 'Bod 2 µm', 'Bod 3 µm', 'Průměr µm'],
                        Array.from({ length: 10 }, (_, piece) => [`D${piece + 1}`, 168 + piece, 172 - piece, 170, 170]),
                    ),
                },
            ];
        case 'qc':
            return [
                {
                    kind: 'INPUT',
                    name: 'Kontrolní plán.pdf',
                    content: protocol('Kontrolni plan', [
                        '1. Rozmerova kontrola',
                        '2. Vizualni kontrola svaru (ISO 5817 C)',
                        '3. Tloustka povrchove upravy',
                        '4. Zatezovaci zkouska',
                    ]),
                },
                {
                    kind: 'OUTPUT',
                    name: 'Výstupní protokol.pdf',
                    content: protocol('Vystupni kontrola', ['Rozmery: v toleranci', 'Svary: bez vad', 'Povrchova uprava: 170 um']),
                },
            ];
        case 'mount':
        case 'deliver':
            return [
                {
                    kind: 'INPUT',
                    name: 'Montážní postup.pdf',
                    content: protocol('Montazni postup', [
                        '1. Kontrola kotev a vysek',
                        '2. Osazeni nosnych dilu',
                        '3. Rektifikace a dotazeni sroubu',
                        '4. Opravy naterů po montazi',
                    ]),
                },
                { kind: 'INPUT', name: 'Model konstrukce.stl', content: projectModel(project) },
                {
                    kind: 'OUTPUT',
                    name: 'Předávací protokol.pdf',
                    content: protocol('Predavaci protokol', [`Predano zakaznikovi: ${project.customer}`, 'Bez vad a nedodelku.']),
                },
            ];
        default:
            // welding and assembly: weld, gate, fence, railing, make
            return [
                { kind: 'INPUT', name: `Sestava ${number}.svg`, content: drawing(task.name, 600, 260, 5) },
                {
                    kind: 'INPUT',
                    name: 'Model sestavy.stl',
                    content: /gate|fence/.test(task.key) ? gateModel(2500, 9) : /railing/.test(task.key) ? gateModel(1200, 6) : projectModel(project),
                },
                {
                    kind: 'OUTPUT',
                    name: 'Protokol svarů.pdf',
                    content: protocol('Protokol svaru', [
                        'Metoda: 135 (MAG)',
                        'Pridavny material: G3Si1',
                        'Vizualni kontrola: 100 %',
                        'Kapilarni zkouska: 10 % svaru',
                    ]),
                },
            ];
    }
};

// The documentation of a demo machine: manual, inspection report, maintenance plan and safety rules
export const demoMachineFiles = (name: string, description: string, services: { days: number; Title: string; Done: boolean }[]) => [
    {
        name: 'Návod k obsluze.pdf',
        content: pdfDocument(`${name}: navod k obsluze`, [
            description,
            '',
            '1. Pred spustenim zkontrolujte ochranne kryty a nouzove zastaveni.',
            '2. Zapnete hlavni vypinac a pockejte na inicializaci rizeni.',
            '3. Nactete program nebo nastavte parametry podle technologickeho listu.',
            '4. Po skonceni smeny stroj vycistete a zapiste provoz do knihy stroje.',
        ]),
    },
    {
        name: `Revizní zpráva ${new Date().getFullYear()}.pdf`,
        content: pdfDocument(`${name}: revizni zprava`, [
            'Revize elektrickeho zarizeni dle CSN 33 1500.',
            'Ochrana samocinnym odpojenim: vyhovuje.',
            'Izolacni odpor: > 100 MOhm.',
            '',
            'Zaver: zarizeni je schopne bezpecneho provozu.',
        ]),
    },
    {
        name: 'Plán údržby.csv',
        content: csvTable(
            ['Činnost', 'Interval', 'Stav'],
            [
                ['Denní čištění a kontrola', 'směna', 'průběžně'],
                ...services.map((service) => [service.Title, 'dle plánu', service.Done ? 'hotovo' : 'naplánováno']),
            ],
        ),
    },
    {
        name: 'Bezpečnostní pokyny.txt',
        content: `${name} – bezpečnostní pokyny\n\n- obsluhovat smí jen proškolená osoba\n- při práci používejte ochranné brýle a rukavice\n- nikdy nesahejte do pracovního prostoru za chodu\n- závady hlaste odpovědné osobě stroje\n`,
    },
];
