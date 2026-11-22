import { parseCsv } from './SheetPreview';

test('parseCsv splits by comma and keeps quoted text together', () => {
    expect(parseCsv('a,b,c\n1,"x, y",3\n')).toEqual([
        ['a', 'b', 'c'],
        ['1', 'x, y', '3'],
    ]);
});

test('parseCsv takes ; when Czech Excel wrote it, with "" and CRLF', () => {
    expect(parseCsv('Název;Počet\r\n"Šroub ""M8""";1,5\r\nMatice;')).toEqual([
        ['Název', 'Počet'],
        ['Šroub "M8"', '1,5'],
        ['Matice', ''],
    ]);
});
