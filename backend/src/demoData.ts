// Example data for development and demos (see seed.ts): a small engineering company with its people, machines,
// eight projects, months of worked time, chats and example files.
// Dates are relative to today, so the charts on the overview always show the current week.
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import minMax from 'dayjs/plugin/minMax.js';
import fs from 'node:fs';
import path from 'node:path';
import prisma from './client.ts';
import { hashPassword } from './auth.ts';
import { demoMachineFiles, demoTaskFiles } from './demoFiles.ts';
import { dataDir } from './resources/tasks.ts';

dayjs.extend(isoWeek);
dayjs.extend(minMax);

export const DEMO_PASSWORD = 'demo1234';

// a day of the current week (1 = Monday) at the given hour
const thisWeek = (isoDay: number, hour: number, minute = 0) => dayjs().isoWeekday(isoDay).hour(hour).minute(minute).second(0).millisecond(0).toDate();
// a stable number for a text, so the demo data varies but is the same on every run
const hash = (text: string) => {
    let value = 2166136261;
    for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return value >>> 0;
};
const inDays = (days: number, hour = 14) => dayjs().add(days, 'day').hour(hour).minute(0).second(0).millisecond(0).toDate();

type DemoTask = {
    key: string;
    name: string;
    description: string;
    finish: Date;
    finished?: boolean;
    hours: number;
    owner: string;
    members: string[];
    machine?: string;
    // position in the project's task graph and the node size (10 = XS ... 50 = XL)
    x: number;
    y: number;
    size: number;
};

type DemoProject = {
    name: string;
    customer: string;
    description: string;
    finish: Date;
    finished?: boolean;
    owner: string;
    members: string[];
    tasks: DemoTask[];
    // [predecessor key, successor key]
    dependencies: [string, string][];
};

export const seedDemoData = async () => {
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    const people = [
        { UserName: 'jnovak', FirstName: 'Jan', LastName: 'Novák', Position: 'Vedoucí výroby', UserType: 'MANAGER' as const },
        { UserName: 'pdvorakova', FirstName: 'Petra', LastName: 'Dvořáková', Position: 'Projektová manažerka', UserType: 'MANAGER' as const },
        { UserName: 'tsvoboda', FirstName: 'Tomáš', LastName: 'Svoboda', Position: 'Konstruktér', UserType: 'USER' as const },
        { UserName: 'mcerna', FirstName: 'Marie', LastName: 'Černá', Position: 'Konstruktérka', UserType: 'USER' as const },
        { UserName: 'lprochazka', FirstName: 'Lukáš', LastName: 'Procházka', Position: 'Svářeč', UserType: 'USER' as const },
        { UserName: 'okucera', FirstName: 'Ondřej', LastName: 'Kučera', Position: 'Obsluha CNC', UserType: 'USER' as const },
        { UserName: 'kvesela', FirstName: 'Kateřina', LastName: 'Veselá', Position: 'Lakýrnice', UserType: 'USER' as const },
        { UserName: 'mhajek', FirstName: 'Martin', LastName: 'Hájek', Position: 'Technolog', UserType: 'USER' as const },
        { UserName: 'zkralova', FirstName: 'Zuzana', LastName: 'Králová', Position: 'Nákupčí', UserType: 'USER' as const },
        { UserName: 'dbenes', FirstName: 'David', LastName: 'Beneš', Position: 'Zámečník', UserType: 'USER' as const },
        { UserName: 'pmarek', FirstName: 'Pavel', LastName: 'Marek', Position: 'Svářeč', UserType: 'USER' as const },
        { UserName: 'ejelinkova', FirstName: 'Eva', LastName: 'Jelínková', Position: 'Kontrola kvality', UserType: 'USER' as const },
        { UserName: 'rpokorny', FirstName: 'Radek', LastName: 'Pokorný', Position: 'Montážník', UserType: 'USER' as const },
        { UserName: 'vruzicka', FirstName: 'Vojtěch', LastName: 'Růžička', Position: 'Obsluha CNC', UserType: 'USER' as const },
    ];
    const users: Record<string, number> = {};
    for (const person of people) {
        const user = await prisma.user.create({ data: { ...person, PasswordHash: passwordHash, Enabled: true } });
        users[person.UserName] = user.ID;
    }
    // who leads whom (the team statistics): production under Jan Novák, design, purchasing and quality under Petra Dvořáková
    const teams = {
        jnovak: ['lprochazka', 'okucera', 'kvesela', 'dbenes', 'pmarek', 'rpokorny', 'vruzicka'],
        pdvorakova: ['tsvoboda', 'mcerna', 'mhajek', 'ejelinkova', 'zkralova'],
    };
    for (const [manager, members] of Object.entries(teams)) {
        await prisma.user.updateMany({ where: { ID: { in: members.map((member) => users[member]) } }, data: { ManagerID: users[manager] } });
    }
    // an account an admin has blocked, to show how that looks
    await prisma.user.create({
        data: {
            UserName: 'jhorak',
            FirstName: 'Jiří',
            LastName: 'Horák',
            Position: 'Brigádník',
            UserType: 'USER',
            PasswordHash: passwordHash,
            Enabled: false,
        },
    });

    // each machine with the person who looks after it and its services: done (days ago) and planned (days ahead)
    const machineList = [
        {
            Name: 'Laser Trumpf',
            Description: 'Vláknový laser 6 kW, plechy do 20 mm.',
            responsible: 'okucera',
            services: [
                { days: -170, Title: 'Výměna ochranného skla a čištění optiky', Done: true },
                { days: -40, Title: 'Servisní prohlídka Trumpf', Done: true },
                { days: 20, Title: 'Kontrola chladicí jednotky', Done: false },
            ],
        },
        {
            Name: 'Ohraňovací lis',
            Description: 'Ohraňovací lis 135 t, délka ohybu 3 m.',
            responsible: 'lprochazka',
            services: [
                { days: -380, Title: 'Roční prohlídka hydrauliky', Done: true },
                { days: -5, Title: 'Roční prohlídka hydrauliky', Done: false },
            ],
        },
        {
            Name: 'CNC frézka',
            Description: 'Pětiosé obráběcí centrum.',
            responsible: 'okucera',
            services: [
                { days: -60, Title: 'Výměna řezné kapaliny', Done: true },
                { days: 45, Title: 'Kalibrace os', Done: false },
            ],
        },
        {
            Name: 'Svařovací robot',
            Description: 'Robotické pracoviště MIG/MAG.',
            responsible: 'lprochazka',
            services: [{ days: -90, Title: 'Kontrola podavače drátu', Done: true }],
        },
        {
            Name: 'Lakovací box',
            Description: 'Práškové lakování, vypalovací pec do 200 °C.',
            responsible: 'kvesela',
            services: [{ days: 10, Title: 'Výměna filtrů', Done: false }],
        },
        {
            Name: 'Pásová pila Pegas',
            Description: 'Poloautomatická pásová pila, řez do 320 mm, pokosy ±60°.',
            responsible: 'dbenes',
            services: [
                { days: -120, Title: 'Výměna pilového pásu a kartáče', Done: true },
                { days: -14, Title: 'Kontrola hydrauliky posuvu', Done: true },
                { days: 30, Title: 'Výměna oleje v převodovce', Done: false },
            ],
        },
        {
            Name: 'Ohýbačka trubek',
            Description: 'CNC ohýbačka trubek do Ø76 mm, tři osy.',
            responsible: 'pmarek',
            services: [
                { days: -200, Title: 'Kalibrace úhlu ohybu', Done: true },
                { days: 3, Title: 'Výměna trnu a kontrola čelistí', Done: false },
            ],
        },
    ];
    const machines: Record<string, number> = {};
    for (const { responsible, services, ...machine } of machineList) {
        machines[machine.Name] = (
            await prisma.machine.create({
                data: {
                    ...machine,
                    ResponsibleID: users[responsible],
                    Services: {
                        create: services.map(({ days, ...service }) => ({ ...service, Date: inDays(days, 8), CreatedByID: users.jnovak })),
                    },
                },
            })
        ).ID;
    }

    const projects: DemoProject[] = [
        {
            name: 'Ocelová hala Brno',
            customer: 'Stavby Morava s.r.o.',
            description: 'Výroba a montáž nosné konstrukce skladové haly 24 × 60 m.',
            finish: inDays(40),
            owner: 'pdvorakova',
            members: ['pdvorakova', 'tsvoboda', 'lprochazka', 'okucera', 'kvesela'],
            tasks: [
                {
                    key: 'design',
                    name: 'Výkresová dokumentace',
                    description: 'Výrobní výkresy sloupů a vazníků.',
                    finish: thisWeek(1, 12),
                    finished: true,
                    hours: 16,
                    owner: 'tsvoboda',
                    members: ['tsvoboda'],
                    x: 0,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'cut',
                    name: 'Řezání plechů',
                    description: 'Pálení přírub a výztuh na laseru.',
                    finish: thisWeek(2, 11),
                    finished: true,
                    hours: 6,
                    owner: 'okucera',
                    members: ['okucera'],
                    machine: 'Laser Trumpf',
                    x: 2,
                    y: -1,
                    size: 30,
                },
                {
                    key: 'bend',
                    name: 'Ohýbání profilů',
                    description: 'Ohyb vaznic Z 200.',
                    finish: thisWeek(3, 10),
                    hours: 5,
                    owner: 'okucera',
                    members: ['okucera'],
                    machine: 'Ohraňovací lis',
                    x: 2,
                    y: 1,
                    size: 20,
                },
                {
                    key: 'weld',
                    name: 'Svařování sloupů',
                    description: '12 sloupů HEA 300 s patními plechy.',
                    finish: thisWeek(4, 15),
                    hours: 20,
                    owner: 'lprochazka',
                    members: ['lprochazka'],
                    machine: 'Svařovací robot',
                    x: 4,
                    y: 0,
                    size: 50,
                },
                {
                    key: 'paint',
                    name: 'Lakování',
                    description: 'Základní nátěr a vrchní barva RAL 7016.',
                    finish: thisWeek(5, 13),
                    hours: 8,
                    owner: 'kvesela',
                    members: ['kvesela'],
                    machine: 'Lakovací box',
                    x: 6,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'deliver',
                    name: 'Expedice na stavbu',
                    description: 'Naložení a doprava, 3 kamiony.',
                    finish: inDays(10),
                    hours: 4,
                    owner: 'pdvorakova',
                    members: ['pdvorakova', 'lprochazka'],
                    x: 8,
                    y: 0,
                    size: 20,
                },
            ],
            dependencies: [
                ['design', 'cut'],
                ['design', 'bend'],
                ['cut', 'weld'],
                ['bend', 'weld'],
                ['weld', 'paint'],
                ['paint', 'deliver'],
            ],
        },
        {
            name: 'Zábradlí bytový dům Olomouc',
            customer: 'Rezidence Řepčín a.s.',
            description: 'Nerezové zábradlí 48 balkonů a schodiště.',
            finish: inDays(21),
            owner: 'jnovak',
            members: ['jnovak', 'mcerna', 'lprochazka', 'okucera'],
            tasks: [
                {
                    key: 'measure',
                    name: 'Zaměření na stavbě',
                    description: 'Kontrolní zaměření balkonů.',
                    finish: inDays(-5),
                    finished: true,
                    hours: 6,
                    owner: 'mcerna',
                    members: ['mcerna'],
                    x: 0,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'design',
                    name: 'Návrh kotvení',
                    description: 'Statický výpočet a detail kotvení.',
                    finish: thisWeek(2, 16),
                    finished: true,
                    hours: 10,
                    owner: 'mcerna',
                    members: ['mcerna'],
                    x: 2,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'machine',
                    name: 'Obrábění kotev',
                    description: '96 kotevních desek.',
                    finish: thisWeek(3, 14),
                    hours: 7,
                    owner: 'okucera',
                    members: ['okucera'],
                    machine: 'CNC frézka',
                    x: 4,
                    y: -1,
                    size: 30,
                },
                {
                    key: 'weld',
                    name: 'Svařování výplní',
                    description: 'Svary TIG, broušení a leštění.',
                    finish: thisWeek(5, 11),
                    hours: 24,
                    owner: 'lprochazka',
                    members: ['lprochazka'],
                    x: 4,
                    y: 1,
                    size: 40,
                },
                {
                    key: 'mount',
                    name: 'Montáž',
                    description: 'Montáž po patrech, 2 montéři.',
                    finish: inDays(18),
                    hours: 32,
                    owner: 'jnovak',
                    members: ['jnovak', 'lprochazka'],
                    x: 6,
                    y: 0,
                    size: 50,
                },
            ],
            dependencies: [
                ['measure', 'design'],
                ['design', 'machine'],
                ['design', 'weld'],
                ['machine', 'mount'],
                ['weld', 'mount'],
            ],
        },
        {
            name: 'Přístřešek pro kola',
            customer: 'Město Kroměříž',
            description: 'Krytý stojan na 20 kol, pozinkovaná ocel.',
            finish: inDays(-14),
            finished: true,
            owner: 'pdvorakova',
            members: ['pdvorakova', 'tsvoboda', 'kvesela'],
            tasks: [
                {
                    key: 'design',
                    name: 'Návrh konstrukce',
                    description: 'Vizualizace a výkresy.',
                    finish: inDays(-30),
                    finished: true,
                    hours: 8,
                    owner: 'tsvoboda',
                    members: ['tsvoboda'],
                    x: 0,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'make',
                    name: 'Výroba',
                    description: 'Řezání, svařování, zinkování.',
                    finish: inDays(-20),
                    finished: true,
                    hours: 18,
                    owner: 'tsvoboda',
                    members: ['tsvoboda'],
                    machine: 'Laser Trumpf',
                    x: 2,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'paint',
                    name: 'Lakování',
                    description: 'Barva dle požadavku města.',
                    finish: inDays(-16),
                    finished: true,
                    hours: 5,
                    owner: 'kvesela',
                    members: ['kvesela'],
                    machine: 'Lakovací box',
                    x: 4,
                    y: 0,
                    size: 20,
                },
            ],
            dependencies: [
                ['design', 'make'],
                ['make', 'paint'],
            ],
        },
        {
            name: 'Ocelové schodiště Zlín',
            customer: 'Univerzita Tomáše Bati',
            description: 'Venkovní únikové schodiště ke knihovně, 4 ramena, žárově zinkované s práškovým lakem.',
            finish: inDays(25),
            owner: 'pdvorakova',
            members: ['pdvorakova', 'mcerna', 'dbenes', 'pmarek', 'kvesela', 'ejelinkova', 'vruzicka', 'rpokorny'],
            tasks: [
                {
                    key: 'design',
                    name: 'Návrh a statika',
                    description: 'Statický výpočet schodnic a podest.',
                    finish: inDays(-20),
                    finished: true,
                    hours: 24,
                    owner: 'mcerna',
                    members: ['mcerna', 'pdvorakova'],
                    x: 0,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'drawings',
                    name: 'Výrobní výkresy',
                    description: 'Schodnice, stupně, podesty, zábradlí.',
                    finish: inDays(-12),
                    finished: true,
                    hours: 16,
                    owner: 'mcerna',
                    members: ['mcerna'],
                    x: 2,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'cut',
                    name: 'Pálení stupnic',
                    description: 'Stupně z kompozitního roštu, pásnice P10.',
                    finish: inDays(-6),
                    finished: true,
                    hours: 8,
                    owner: 'vruzicka',
                    members: ['vruzicka'],
                    machine: 'Laser Trumpf',
                    x: 4,
                    y: -1,
                    size: 30,
                },
                {
                    key: 'weld',
                    name: 'Výroba schodnic',
                    description: 'Schodnice UPE 240, svaření a rovnání.',
                    finish: inDays(2),
                    hours: 22,
                    owner: 'dbenes',
                    members: ['dbenes', 'pmarek'],
                    machine: 'Svařovací robot',
                    x: 4,
                    y: 1,
                    size: 40,
                },
                {
                    key: 'railing',
                    name: 'Zábradlí schodiště',
                    description: 'Madla Ø42,4 a svislá výplň.',
                    finish: inDays(8),
                    hours: 14,
                    owner: 'pmarek',
                    members: ['pmarek'],
                    machine: 'Ohýbačka trubek',
                    x: 6,
                    y: 1,
                    size: 30,
                },
                {
                    key: 'paint',
                    name: 'Zinkování a lakování',
                    description: 'Duplexní povrchová úprava RAL 7016.',
                    finish: inDays(14),
                    hours: 10,
                    owner: 'kvesela',
                    members: ['kvesela'],
                    machine: 'Lakovací box',
                    x: 8,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'qc',
                    name: 'Výstupní kontrola',
                    description: 'Rozměrová kontrola a protokol svarů.',
                    finish: inDays(18),
                    hours: 4,
                    owner: 'ejelinkova',
                    members: ['ejelinkova'],
                    x: 10,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'mount',
                    name: 'Montáž na místě',
                    description: 'Osazení na kotvy a dotažení.',
                    finish: inDays(24),
                    hours: 32,
                    owner: 'rpokorny',
                    members: ['rpokorny', 'dbenes'],
                    x: 12,
                    y: 0,
                    size: 50,
                },
            ],
            dependencies: [
                ['design', 'drawings'],
                ['drawings', 'cut'],
                ['cut', 'weld'],
                ['weld', 'railing'],
                ['railing', 'paint'],
                ['paint', 'qc'],
                ['qc', 'mount'],
            ],
        },
        {
            name: 'Rozšíření haly Ostrava',
            customer: 'Moravia Logistic a.s.',
            description: 'Přístavba skladové haly o 3 pole (18 × 36 m) včetně jeřábové dráhy.',
            finish: inDays(95),
            owner: 'jnovak',
            members: ['jnovak', 'tsvoboda', 'mhajek', 'zkralova', 'okucera', 'lprochazka', 'rpokorny'],
            tasks: [
                {
                    key: 'offer',
                    name: 'Cenová nabídka',
                    description: 'Rozpočet materiálu a práce.',
                    finish: inDays(-10),
                    finished: true,
                    hours: 8,
                    owner: 'zkralova',
                    members: ['zkralova', 'jnovak'],
                    x: 0,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'survey',
                    name: 'Zaměření stávající haly',
                    description: 'Kotvy, výšky, napojení na stávající rámy.',
                    finish: inDays(-3),
                    finished: true,
                    hours: 12,
                    owner: 'mhajek',
                    members: ['mhajek'],
                    x: 2,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'static',
                    name: 'Statický výpočet',
                    description: 'Rámy, jeřábová dráha 5 t, ztužidla.',
                    finish: inDays(12),
                    hours: 30,
                    owner: 'tsvoboda',
                    members: ['tsvoboda'],
                    x: 4,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'drawings',
                    name: 'Výkresy přístavby',
                    description: 'Dílenská dokumentace všech dílců.',
                    finish: inDays(25),
                    hours: 40,
                    owner: 'tsvoboda',
                    members: ['tsvoboda', 'mhajek'],
                    x: 6,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'order',
                    name: 'Objednávka materiálu',
                    description: 'Profily HEB, plechy, spojovací materiál.',
                    finish: inDays(30),
                    hours: 6,
                    owner: 'zkralova',
                    members: ['zkralova'],
                    x: 8,
                    y: -1,
                    size: 20,
                },
                {
                    key: 'weld',
                    name: 'Výroba konstrukce',
                    description: 'Rámy, vaznice, jeřábová dráha.',
                    finish: inDays(60),
                    hours: 120,
                    owner: 'lprochazka',
                    members: ['lprochazka', 'okucera'],
                    machine: 'Svařovací robot',
                    x: 10,
                    y: 0,
                    size: 50,
                },
                {
                    key: 'mount',
                    name: 'Montáž přístavby',
                    description: 'Montáž s autojeřábem, 3 týdny.',
                    finish: inDays(90),
                    hours: 160,
                    owner: 'rpokorny',
                    members: ['rpokorny', 'lprochazka'],
                    x: 12,
                    y: 0,
                    size: 50,
                },
            ],
            dependencies: [
                ['offer', 'survey'],
                ['survey', 'static'],
                ['static', 'drawings'],
                ['drawings', 'order'],
                ['order', 'weld'],
                ['drawings', 'weld'],
                ['weld', 'mount'],
            ],
        },
        {
            name: 'Billboard D1 Brno',
            customer: 'Outdoor Media s.r.o.',
            description: 'Nosná konstrukce oboustranného billboardu 12 × 4 m u dálnice D1.',
            finish: inDays(-60),
            finished: true,
            owner: 'jnovak',
            members: ['jnovak', 'tsvoboda', 'pmarek', 'kvesela', 'rpokorny'],
            tasks: [
                {
                    key: 'design',
                    name: 'Návrh konstrukce',
                    description: 'Výpočet na zatížení větrem.',
                    finish: inDays(-90),
                    finished: true,
                    hours: 12,
                    owner: 'tsvoboda',
                    members: ['tsvoboda'],
                    x: 0,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'weld',
                    name: 'Svařování nosníku',
                    description: 'Příhradový nosník a stožár.',
                    finish: inDays(-75),
                    finished: true,
                    hours: 18,
                    owner: 'pmarek',
                    members: ['pmarek'],
                    machine: 'Svařovací robot',
                    x: 2,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'paint',
                    name: 'Lakování',
                    description: 'Zinek + lak RAL 9006.',
                    finish: inDays(-68),
                    finished: true,
                    hours: 6,
                    owner: 'kvesela',
                    members: ['kvesela'],
                    machine: 'Lakovací box',
                    x: 4,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'mount',
                    name: 'Montáž u dálnice',
                    description: 'Noční montáž s uzavírkou pruhu.',
                    finish: inDays(-61),
                    finished: true,
                    hours: 16,
                    owner: 'rpokorny',
                    members: ['rpokorny', 'pmarek'],
                    x: 6,
                    y: 0,
                    size: 40,
                },
            ],
            dependencies: [
                ['design', 'weld'],
                ['weld', 'paint'],
                ['paint', 'mount'],
            ],
        },
        {
            name: 'Plošina k lince Tatra',
            customer: 'Tatra Trucks a.s.',
            description: 'Obslužná plošina se schody a zábradlím k lisovací lince, nosnost 500 kg/m².',
            finish: inDays(5),
            owner: 'pdvorakova',
            members: ['pdvorakova', 'mhajek', 'okucera', 'vruzicka', 'dbenes', 'ejelinkova'],
            tasks: [
                {
                    key: 'design',
                    name: 'Návrh plošiny',
                    description: 'Dispozice podle prostoru u linky.',
                    finish: inDays(-15),
                    finished: true,
                    hours: 10,
                    owner: 'mhajek',
                    members: ['mhajek', 'pdvorakova'],
                    x: 0,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'machine',
                    name: 'Obrábění konzol',
                    description: 'Konzoly a kotevní desky na CNC.',
                    finish: inDays(-2),
                    hours: 12,
                    owner: 'vruzicka',
                    members: ['vruzicka'],
                    machine: 'CNC frézka',
                    x: 2,
                    y: -1,
                    size: 30,
                },
                {
                    key: 'cut',
                    name: 'Řezání podlahových plechů',
                    description: 'Slzičkový plech tl. 5 mm.',
                    finish: inDays(-4),
                    finished: true,
                    hours: 6,
                    owner: 'okucera',
                    members: ['okucera'],
                    machine: 'Laser Trumpf',
                    x: 2,
                    y: 1,
                    size: 20,
                },
                {
                    key: 'bend',
                    name: 'Ohyb plechů',
                    description: 'Lemy podlahových plechů.',
                    finish: inDays(1),
                    hours: 6,
                    owner: 'okucera',
                    members: ['okucera'],
                    machine: 'Ohraňovací lis',
                    x: 4,
                    y: 1,
                    size: 20,
                },
                {
                    key: 'weld',
                    name: 'Sestava plošiny',
                    description: 'Svaření rámu, schodů a zábradlí.',
                    finish: inDays(3),
                    hours: 20,
                    owner: 'dbenes',
                    members: ['dbenes'],
                    x: 6,
                    y: 0,
                    size: 40,
                },
                {
                    key: 'qc',
                    name: 'Kontrola a protokol',
                    description: 'Zatěžovací zkouška a předávací protokol.',
                    finish: inDays(5),
                    hours: 3,
                    owner: 'ejelinkova',
                    members: ['ejelinkova'],
                    x: 8,
                    y: 0,
                    size: 20,
                },
            ],
            dependencies: [
                ['design', 'machine'],
                ['design', 'cut'],
                ['cut', 'bend'],
                ['machine', 'weld'],
                ['bend', 'weld'],
                ['weld', 'qc'],
            ],
        },
        {
            name: 'Brány a oplocení Pardubice',
            customer: 'Synthesia Park a.s.',
            description: 'Posuvná brána 8 m, 2 branky a 180 m oplocení průmyslového areálu.',
            finish: inDays(50),
            owner: 'jnovak',
            members: ['jnovak', 'mcerna', 'pmarek', 'dbenes', 'kvesela', 'rpokorny', 'zkralova'],
            tasks: [
                {
                    key: 'design',
                    name: 'Návrh brány a plotu',
                    description: 'Typová pole a posuvná brána s pohonem.',
                    finish: inDays(-5),
                    finished: true,
                    hours: 8,
                    owner: 'mcerna',
                    members: ['mcerna', 'jnovak'],
                    x: 0,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'order',
                    name: 'Objednávka materiálu',
                    description: 'Jekly, pohon brány, kotvy.',
                    finish: inDays(2),
                    hours: 4,
                    owner: 'zkralova',
                    members: ['zkralova'],
                    x: 2,
                    y: 0,
                    size: 20,
                },
                {
                    key: 'gate',
                    name: 'Výroba posuvné brány',
                    description: 'Rám z jeklů 80 × 80, výplň svislé tyče.',
                    finish: inDays(20),
                    hours: 30,
                    owner: 'pmarek',
                    members: ['pmarek'],
                    machine: 'Svařovací robot',
                    x: 4,
                    y: -1,
                    size: 40,
                },
                {
                    key: 'fence',
                    name: 'Výroba polí plotu',
                    description: '72 polí 2,5 × 1,8 m.',
                    finish: inDays(25),
                    hours: 40,
                    owner: 'dbenes',
                    members: ['dbenes', 'pmarek'],
                    machine: 'Pásová pila Pegas',
                    x: 4,
                    y: 1,
                    size: 40,
                },
                {
                    key: 'paint',
                    name: 'Lakování',
                    description: 'Zinek + lak RAL 6005.',
                    finish: inDays(35),
                    hours: 12,
                    owner: 'kvesela',
                    members: ['kvesela'],
                    machine: 'Lakovací box',
                    x: 6,
                    y: 0,
                    size: 30,
                },
                {
                    key: 'mount',
                    name: 'Montáž oplocení',
                    description: 'Patky, sloupky, pole, seřízení brány.',
                    finish: inDays(48),
                    hours: 40,
                    owner: 'rpokorny',
                    members: ['rpokorny', 'dbenes'],
                    x: 8,
                    y: 0,
                    size: 40,
                },
            ],
            dependencies: [
                ['design', 'order'],
                ['order', 'gate'],
                ['order', 'fence'],
                ['gate', 'paint'],
                ['fence', 'paint'],
                ['paint', 'mount'],
            ],
        },
    ];

    const taskIDs: Record<string, number> = {};
    const projectIDs: Record<string, number> = {};
    const createdTasks: { project: DemoProject; task: DemoTask; ID: number; projectID: number }[] = [];
    for (const project of projects) {
        const created = await prisma.project.create({
            data: {
                Name: project.name,
                Customer: project.customer,
                Description: project.description,
                FinishDate: project.finish,
                Finished: project.finished ?? false,
                OwnerID: users[project.owner],
                Member: { create: project.members.map((member) => ({ UserID: users[member] })) },
            },
        });
        projectIDs[project.name] = created.ID;
        for (const task of project.tasks) {
            const createdTask = await prisma.task.create({
                data: {
                    Name: task.name,
                    Description: task.description,
                    FinishDate: task.finish,
                    Finished: task.finished ?? false,
                    DurationHours: task.hours,
                    DurationMinutes: 0,
                    XPosition: task.x,
                    YPosition: task.y,
                    Size: task.size,
                    OwnerID: users[task.owner],
                    ProjectID: created.ID,
                    MachineID: task.machine ? machines[task.machine] : null,
                    User_Task: { create: task.members.map((member) => ({ UserID: users[member] })) },
                },
            });
            taskIDs[`${project.name}/${task.key}`] = createdTask.ID;
            createdTasks.push({ project, task, ID: createdTask.ID, projectID: created.ID });
        }
        for (const [predecessor, successor] of project.dependencies) {
            await prisma.taskDependency.create({
                data: {
                    ProjectID: created.ID,
                    PredecessorID: taskIDs[`${project.name}/${predecessor}`],
                    SuccessorID: taskIDs[`${project.name}/${successor}`],
                },
            });
        }
    }

    // stock: what was bought, used and reserved for tasks
    const hall = (key: string) => taskIDs[`Ocelová hala Brno/${key}`];
    const railing = (key: string) => taskIDs[`Zábradlí bytový dům Olomouc/${key}`];
    const taskOf = (project: string, key: string) => taskIDs[`${project}/${key}`];
    const materialList: { Name: string; Description: string; events: { EventType: 'ADD' | 'REMOVE' | 'RESERVATION'; Count: number; task?: number }[] }[] = [
        {
            Name: 'Plech S235 tl. 10 mm',
            Description: 'Tabule 1500 × 3000 mm',
            events: [
                { EventType: 'ADD', Count: 40 },
                { EventType: 'REMOVE', Count: 12, task: hall('cut') },
                { EventType: 'RESERVATION', Count: 8, task: hall('weld') },
            ],
        },
        {
            Name: 'Profil HEA 300',
            Description: 'Délka 12 m',
            events: [
                { EventType: 'ADD', Count: 14 },
                { EventType: 'RESERVATION', Count: 12, task: hall('weld') },
            ],
        },
        {
            Name: 'Vaznice Z 200',
            Description: 'Délka 6 m',
            events: [
                { EventType: 'ADD', Count: 60 },
                { EventType: 'RESERVATION', Count: 48, task: hall('bend') },
            ],
        },
        {
            Name: 'Nerezová trubka 42,4 × 2',
            Description: 'AISI 304, délka 6 m',
            events: [
                { EventType: 'ADD', Count: 120 },
                { EventType: 'RESERVATION', Count: 96, task: railing('weld') },
            ],
        },
        {
            Name: 'Kotevní šroub M12',
            Description: 'Chemická kotva',
            events: [
                { EventType: 'ADD', Count: 500 },
                { EventType: 'REMOVE', Count: 120 },
                { EventType: 'RESERVATION', Count: 384, task: railing('mount') },
            ],
        },
        {
            Name: 'Svařovací drát G3Si1 1,0 mm',
            Description: 'Cívka 15 kg',
            events: [
                { EventType: 'ADD', Count: 10 },
                { EventType: 'REMOVE', Count: 3, task: hall('weld') },
            ],
        },
        {
            Name: 'Prášková barva RAL 7016',
            Description: 'Balení 20 kg',
            events: [
                { EventType: 'ADD', Count: 6 },
                { EventType: 'RESERVATION', Count: 4, task: hall('paint') },
            ],
        },
        {
            Name: 'Profil UPE 240',
            Description: 'Délka 12 m',
            events: [
                { EventType: 'ADD', Count: 10 },
                { EventType: 'REMOVE', Count: 4, task: taskOf('Ocelové schodiště Zlín', 'weld') },
                { EventType: 'RESERVATION', Count: 4, task: taskOf('Ocelové schodiště Zlín', 'weld') },
            ],
        },
        {
            Name: 'Kompozitní rošt 30 × 30',
            Description: 'Stupně schodiště, protiskluzný povrch',
            events: [
                { EventType: 'ADD', Count: 64 },
                { EventType: 'REMOVE', Count: 64, task: taskOf('Ocelové schodiště Zlín', 'cut') },
            ],
        },
        {
            Name: 'Jekl 80 × 80 × 4',
            Description: 'S355, délka 6 m',
            events: [
                { EventType: 'ADD', Count: 90 },
                { EventType: 'RESERVATION', Count: 24, task: taskOf('Brány a oplocení Pardubice', 'gate') },
                { EventType: 'RESERVATION', Count: 60, task: taskOf('Brány a oplocení Pardubice', 'fence') },
            ],
        },
        {
            Name: 'Jekl 40 × 20 × 2',
            Description: 'Výplň plotových polí, délka 6 m',
            events: [
                { EventType: 'ADD', Count: 400 },
                { EventType: 'RESERVATION', Count: 360, task: taskOf('Brány a oplocení Pardubice', 'fence') },
            ],
        },
        {
            Name: 'Slzičkový plech tl. 5 mm',
            Description: 'Tabule 1500 × 3000 mm',
            events: [
                { EventType: 'ADD', Count: 20 },
                { EventType: 'REMOVE', Count: 14, task: taskOf('Plošina k lince Tatra', 'cut') },
            ],
        },
        {
            Name: 'Profil HEB 300',
            Description: 'Délka 12 m, rámy přístavby',
            events: [{ EventType: 'ADD', Count: 6 }],
        },
        {
            Name: 'Šroub M20 × 80 8.8',
            Description: 'Pozinkovaný, s maticí a podložkou',
            events: [
                { EventType: 'ADD', Count: 800 },
                { EventType: 'REMOVE', Count: 160, task: taskOf('Billboard D1 Brno', 'mount') },
                { EventType: 'RESERVATION', Count: 240, task: taskOf('Ocelové schodiště Zlín', 'mount') },
            ],
        },
        {
            Name: 'Prášková barva RAL 6005',
            Description: 'Mechově zelená, balení 20 kg',
            events: [
                { EventType: 'ADD', Count: 8 },
                { EventType: 'RESERVATION', Count: 7, task: taskOf('Brány a oplocení Pardubice', 'paint') },
            ],
        },
        {
            Name: 'Wolframová elektroda 2,4 mm',
            Description: 'WL20, balení 10 ks',
            events: [
                { EventType: 'ADD', Count: 12 },
                { EventType: 'REMOVE', Count: 5, task: railing('weld') },
            ],
        },
        {
            Name: 'Ochranný plyn Ar/CO2 82/18',
            Description: 'Láhev 20 l',
            events: [
                { EventType: 'ADD', Count: 8 },
                { EventType: 'REMOVE', Count: 5 },
                { EventType: 'RESERVATION', Count: 2, task: taskOf('Plošina k lince Tatra', 'weld') },
            ],
        },
    ];
    // unit, price per unit (Kč), supplier, place in the stock and the minimum of each item
    const materialDetails: Record<string, [string, number, string, string, number]> = {
        'Plech S235 tl. 10 mm': ['ks', 6900, 'Ferona a.s.', 'Hala B, regál 1', 10],
        'Profil HEA 300': ['ks', 21400, 'Ferona a.s.', 'Venkovní sklad, pole 2', 4],
        'Vaznice Z 200': ['ks', 1850, 'Lindab s.r.o.', 'Venkovní sklad, pole 4', 20],
        'Nerezová trubka 42,4 × 2': ['ks', 1450, 'Inox Brno s.r.o.', 'Hala A, regál 5', 30],
        'Kotevní šroub M12': ['ks', 14, 'Hilti ČR', 'Sklad spojovacího materiálu, B2', 200],
        'Svařovací drát G3Si1 1,0 mm': ['cívka', 980, 'ESAB Vamberk', 'Svařovna, skříň 1', 4],
        'Prášková barva RAL 7016': ['balení', 3200, 'Tiger Coatings', 'Lakovna, sklad barev', 2],
        'Profil UPE 240': ['ks', 9800, 'Ferona a.s.', 'Venkovní sklad, pole 1', 2],
        'Kompozitní rošt 30 × 30': ['ks', 690, 'Mefa Group', 'Hala B, regál 6', 0],
        'Jekl 80 × 80 × 4': ['ks', 1150, 'Ferona a.s.', 'Hala A, regál 2', 20],
        'Jekl 40 × 20 × 2': ['ks', 260, 'Ferona a.s.', 'Hala A, regál 3', 50],
        'Slzičkový plech tl. 5 mm': ['ks', 3600, 'Ferona a.s.', 'Hala B, regál 2', 5],
        'Profil HEB 300': ['ks', 14200, 'Ferona a.s.', 'Venkovní sklad, pole 3', 10],
        'Šroub M20 × 80 8.8': ['ks', 19, 'Würth s.r.o.', 'Sklad spojovacího materiálu, A1', 300],
        'Prášková barva RAL 6005': ['balení', 3350, 'Tiger Coatings', 'Lakovna, sklad barev', 2],
        'Wolframová elektroda 2,4 mm': ['balení', 540, 'ESAB Vamberk', 'Svařovna, skříň 2', 3],
        'Ochranný plyn Ar/CO2 82/18': ['láhev', 1890, 'Linde Gas a.s.', 'Sklad plynů', 3],
    };
    // whoever owns the task takes the items out and reserves them, purchasing (Zuzana) puts them in stock; the movements
    // are spread over the last weeks, each item's in the order listed
    const taskOwners = new Map(createdTasks.map((entry) => [entry.ID, entry.task.owner]));
    const materialIDs: Record<string, number> = {};
    for (const material of materialList) {
        const [Unit, Price, Supplier, Location, MinCount] = materialDetails[material.Name];
        const offset = hash(material.Name) % 6;
        const created = await prisma.material.create({
            data: { Name: material.Name, Description: material.Description, Unit, Price, Supplier, Location, MinCount },
        });
        materialIDs[material.Name] = created.ID;
        // one by one, so they keep their order
        for (const [index, event] of material.events.entries()) {
            await prisma.materialEvent.create({
                data: {
                    MaterialID: created.ID,
                    EventType: event.EventType,
                    Count: event.Count,
                    TargetTaskID: event.task ?? null,
                    TargetUserID: event.EventType === 'ADD' ? users.zkralova : users[(event.task && taskOwners.get(event.task)) || 'jnovak'],
                    CreatedAt: inDays(Math.min(-1, -40 + offset + index * 11), 8 + index),
                },
            });
        }
    }

    // requests for material: one waiting for approval, one approved and waiting to be stocked
    await prisma.materialRequest.createMany({
        data: [
            {
                Name: 'Kotevní šroub M16',
                Description: 'Pro patky sloupů haly',
                Count: 96,
                Price: 45,
                AddedDate: inDays(-2),
                NeededDate: inDays(5),
                TargetUserID: users.lprochazka,
                TargetTaskID: hall('weld'),
            },
            {
                Name: 'Brusné kotouče 125 mm',
                Description: 'Zrnitost 80',
                Count: 50,
                Price: 32,
                AddedDate: inDays(-4),
                NeededDate: inDays(3),
                TargetUserID: users.lprochazka,
                TargetTaskID: railing('weld'),
                AcceptedByID: users.jnovak,
                AcceptedDate: inDays(-1),
            },
            {
                Name: 'Skla na zábradlí',
                Description: 'Bezpečnostní sklo 10 mm, na míru',
                Count: 12,
                Price: 2400,
                AddedDate: inDays(-1),
                NeededDate: inDays(14),
                TargetUserID: users.mcerna,
                TargetTaskID: railing('mount'),
            },
            {
                Name: 'Pohon posuvné brány',
                Description: 'Nice Robus 1000, s fotobuňkami',
                Count: 1,
                Price: 18900,
                AddedDate: inDays(-3),
                NeededDate: inDays(12),
                TargetUserID: users.zkralova,
                TargetTaskID: taskOf('Brány a oplocení Pardubice', 'gate'),
            },
            {
                Name: 'Profil HEB 300',
                Description: 'Doobjednat pro rámy přístavby, 12 m',
                MaterialID: materialIDs['Profil HEB 300'],
                Count: 18,
                Price: 14200,
                AddedDate: inDays(-6),
                NeededDate: inDays(28),
                TargetUserID: users.zkralova,
                TargetTaskID: taskOf('Rozšíření haly Ostrava', 'order'),
                AcceptedByID: users.jnovak,
                AcceptedDate: inDays(-5),
            },
            {
                Name: 'Řezné destičky CNMG 120408',
                Description: 'Pro obrábění konzol',
                Count: 20,
                Price: 190,
                AddedDate: inDays(-2),
                NeededDate: inDays(1),
                TargetUserID: users.vruzicka,
                TargetTaskID: taskOf('Plošina k lince Tatra', 'machine'),
            },
            {
                Name: 'Pilový pás M42 4115 mm',
                Description: 'Náhradní pás na Pegas',
                Count: 2,
                Price: 2350,
                AddedDate: inDays(-8),
                NeededDate: inDays(-1),
                TargetUserID: users.dbenes,
                AcceptedByID: users.jnovak,
                AcceptedDate: inDays(-7),
            },
            {
                Name: 'Madlo dřevěné dub 50 mm',
                Description: 'Varianta zábradlí na přání investora',
                Count: 30,
                Price: 640,
                AddedDate: inDays(0, 9),
                NeededDate: inDays(10),
                TargetUserID: users.pmarek,
                TargetTaskID: taskOf('Ocelové schodiště Zlín', 'railing'),
            },
        ],
    });

    // everyone's attendance for the last 16 weeks and this week up to today (the "Odpracovaný čas" chart and the
    // statistics), with an odd day off; the same days off apply to the task time below
    const today = dayjs().startOf('day');
    const firstDay = today.isoWeekday(1).subtract(16, 'week');
    const workers = people.map((person) => person.UserName);
    const dayOff = (worker: string, day: dayjs.Dayjs) => day.isoWeekday() > 5 || hash(`${worker}/${day.format('YYYY-MM-DD')}`) % 17 === 0;
    const workTimes: { UserID: number; StartTime: Date; StopTime: Date }[] = [];
    for (let day = firstDay; !day.isAfter(today); day = day.add(1, 'day')) {
        for (const [index, worker] of workers.entries()) {
            if (dayOff(worker, day)) continue;
            const start = day.hour(6).minute((index * 7) % 30);
            // today only the morning, so the chart doesn't run ahead of the clock
            const end = day.isSame(today)
                ? dayjs.min(day.hour(12).minute(30), dayjs().second(0).millisecond(0))
                : day.hour(14 + ((day.date() + index) % 3)).minute(30);
            if (end.diff(start, 'minute') < 60) continue;
            workTimes.push({ UserID: users[worker], StartTime: start.toDate(), StopTime: end.toDate() });
        }
    }
    await prisma.workTime.createMany({ data: workTimes });

    // time logged on tasks, in sessions of up to 3 hours in the worked hours, going back from the task's deadline (or
    // yesterday): finished tasks took 80-125 % of the estimate, late ones are at 70 %, ones due soon have been started
    const slots = [
        [10, 30],
        [7, 0],
    ];
    const usedSlots = new Set<string>();
    const taskTimes: { UserID: number; TaskID: number; StartTime: Date; StopTime: Date }[] = [];
    for (const { project, task, ID } of createdTasks) {
        const finish = dayjs(task.finish).startOf('day');
        const daysLeft = finish.diff(today, 'day');
        const share = task.finished
            ? 0.8 + (hash(`${project.name}/${task.key}`) % 46) / 100
            : daysLeft < 0
              ? 0.7
              : daysLeft <= 7
                ? 0.4
                : daysLeft <= 21
                  ? 0.15
                  : 0;
        let minutes = Math.round(task.hours * 60 * share);
        let day = dayjs.min(task.finished ? finish.subtract(1, 'day') : finish, today.subtract(1, 'day'));
        let turn = 0;
        while (minutes > 0 && !day.isBefore(firstDay)) {
            for (const [hour, minute] of slots) {
                if (minutes <= 0) break;
                const worker = task.members[turn++ % task.members.length];
                const slot = `${worker}/${day.format('YYYY-MM-DD')}/${hour}`;
                if (dayOff(worker, day) || usedSlots.has(slot)) continue;
                usedSlots.add(slot);
                const length = Math.min(180, minutes);
                minutes -= length;
                const start = day.hour(hour).minute(minute);
                taskTimes.push({ UserID: users[worker], TaskID: ID, StartTime: start.toDate(), StopTime: start.add(length, 'minute').toDate() });
            }
            day = day.subtract(1, 'day');
        }
    }
    await prisma.userTaskTime.createMany({ data: taskTimes });

    // conversations: [sender, days ago, hour, text] in the project chats and [sender, recipient, ...] in direct messages
    const projectChats: Record<string, [string, number, number, string][]> = {
        'Ocelová hala Brno': [
            ['pdvorakova', 6, 8, 'Dobré ráno, investor potvrdil termín montáže. Expedice musí odjet nejpozději za 10 dní.'],
            ['tsvoboda', 6, 9, 'Výkresy sloupů jsou hotové, nahrál jsem je k úkolu.'],
            ['okucera', 5, 7, 'Pálení přírub jede, příruby budou zítra.'],
            ['lprochazka', 3, 13, 'Patní plechy mají jinou rozteč děr než na výkresu, můžeš se podívat?'],
            ['tsvoboda', 3, 14, 'Máš pravdu, opraveno ve verzi B. Díry Ø22, rozteč 220.'],
            ['kvesela', 2, 10, 'Barva RAL 7016 dorazila, lakovat můžu od čtvrtka.'],
            ['pdvorakova', 1, 15, 'Díky všem, jedeme podle plánu. Kamiony jsou objednané.'],
        ],
        'Zábradlí bytový dům Olomouc': [
            ['jnovak', 9, 8, 'Zaměření je hotové, Marie, pošli prosím detail kotvení do pátku.'],
            ['mcerna', 7, 15, 'Kotvení je navržené, výpočet je u úkolu Návrh kotvení.'],
            ['okucera', 4, 11, 'Kotevní desky: 60 ks hotovo, zbytek zítra.'],
            ['lprochazka', 2, 9, 'Leštění výplní mi zabere ještě 2 dny, brusné kotouče došly.'],
            ['jnovak', 2, 10, 'Kotouče jsou schválené, přijdou zítra.'],
            ['mcerna', 0, 8, 'Investor chce na 3. patře změnu výšky zábradlí na 1100 mm.'],
        ],
        'Ocelové schodiště Zlín': [
            ['pdvorakova', 14, 9, 'Statika schválena, můžeme pustit výrobní výkresy.'],
            ['mcerna', 12, 16, 'Výkresy jsou nahrané, kusovník je v CSV.'],
            ['vruzicka', 6, 12, 'Stupně jsou vypálené, 64 ks, leží u svařovny.'],
            ['dbenes', 3, 8, 'Schodnice dvě ze čtyř jsou svařené.'],
            ['pmarek', 1, 14, 'Ohýbačka hlásí chybu osy B, madla dělám ručně, než přijde servis.'],
            ['ejelinkova', 0, 9, 'Na výstupní kontrolu potřebuji protokoly svarů od všech schodnic.'],
        ],
        'Rozšíření haly Ostrava': [
            ['jnovak', 12, 8, 'Nabídka prošla, zákazník podepsal smlouvu. Začínáme.'],
            ['mhajek', 4, 15, 'Zaměření hotové, stávající kotvy jsou o 15 mm mimo, zohledněte to prosím.'],
            ['tsvoboda', 2, 11, 'Beru na vědomí, upravím patky ve výpočtu.'],
            ['zkralova', 1, 9, 'HEB 300 mají u dodavatele 4 týdny, objednávám hned po výkresech.'],
            ['tsvoboda', 0, 10, 'Statika jeřábové dráhy bude do pátku.'],
        ],
        'Plošina k lince Tatra': [
            ['pdvorakova', 8, 8, 'Tatra potřebuje plošinu do konce týdne, je to priorita.'],
            ['okucera', 4, 14, 'Podlahové plechy jsou vypálené.'],
            ['vruzicka', 1, 13, 'Konzoly mám hotové na 80 %, chybí řezné destičky.'],
            ['dbenes', 0, 7, 'Začínám se sestavou, jakmile dorazí konzoly.'],
        ],
        'Brány a oplocení Pardubice': [
            ['jnovak', 5, 9, 'Návrh schválen zákazníkem, barva RAL 6005.'],
            ['zkralova', 3, 10, 'Pohon brány: nabídka od dvou dodavatelů, doporučuji Nice.'],
            ['pmarek', 1, 12, 'Jekly 80 × 80 jsou na skladě, můžu začít s rámem.'],
        ],
        'Billboard D1 Brno': [
            ['jnovak', 62, 8, 'Montáž proběhla v noci bez problémů, uzavírka skončila podle plánu.'],
            ['rpokorny', 61, 9, 'Předávací protokol je podepsaný, nahrál jsem ho k úkolu.'],
        ],
    };
    const directChats: [string, string, number, number, string][] = [
        ['pdvorakova', 'jnovak', 4, 9, 'Ahoj Honzo, můžeme si zítra projít kapacity na prosinec?'],
        ['jnovak', 'pdvorakova', 4, 10, 'Jasně, v 9 u mě.'],
        ['pdvorakova', 'jnovak', 0, 8, 'Tatra volala, chtějí plošinu o dva dny dřív. Dá se to?'],
        ['lprochazka', 'jnovak', 1, 15, 'Svařovací robot hlásí chybu podavače, volal jsem servis.'],
        ['lprochazka', 'jnovak', 0, 7, 'Servis přijede ve středu dopoledne.'],
        ['jnovak', 'tsvoboda', 3, 11, 'Tomáši, stihneš statiku Ostravy do pátku?'],
        ['tsvoboda', 'jnovak', 3, 12, 'Ano, jen potřebuju potvrdit zatížení jeřábové dráhy.'],
        ['kvesela', 'jnovak', 2, 13, 'Můžu si vzít v pátek volno? Lakování haly bude hotové.'],
        ['jnovak', 'kvesela', 2, 14, 'Ano, schváleno.'],
        ['mcerna', 'pdvorakova', 1, 10, 'Posílám změnu výšky zábradlí, prosím o schválení.'],
        ['pdvorakova', 'mcerna', 1, 11, 'Schváleno, zapiš to do výkresu.'],
        ['ejelinkova', 'dbenes', 0, 9, 'Davide, pošli mi prosím protokoly svarů schodnic.'],
    ];
    // what Jan Novák hasn't read yet: the last messages of these conversations
    const unreadForJan: Record<string, number> = { 'Rozšíření haly Ostrava': 2, 'Brány a oplocení Pardubice': 1, pdvorakova: 1, lprochazka: 2 };
    const messages = [
        ...Object.entries(projectChats).flatMap(([name, list]) =>
            list.map(([sender, days, hour, text]) => ({ sender, recipient: null as string | null, project: name, days, hour, text })),
        ),
        ...directChats.map(([sender, recipient, days, hour, text]) => ({ sender, recipient, project: null as string | null, days, hour, text })),
    ].sort((a, b) => b.days - a.days || a.hour - b.hour);
    const sent: { ID: number; sender: string; recipient: string | null; project: string | null }[] = [];
    for (const [index, message] of messages.entries()) {
        const SentAt = dayjs
            .min(
                today
                    .subtract(message.days, 'day')
                    .hour(message.hour)
                    .minute((index * 13) % 60),
                dayjs().subtract(5, 'minute'),
            )
            .toDate();
        const created = await prisma.chatMessage.create({
            data: {
                SenderID: users[message.sender],
                RecipientID: message.recipient ? users[message.recipient] : null,
                ProjectID: message.project ? projectIDs[message.project] : null,
                Text: message.text,
                SentAt,
            },
        });
        sent.push({ ID: created.ID, ...message });
    }
    // everyone else has read everything
    const lastRead = (list: typeof sent, reader: string, unreadKey: string) => {
        const skip = reader === 'jnovak' ? (unreadForJan[unreadKey] ?? 0) : 0;
        return list[list.length - 1 - skip]?.ID;
    };
    const reads: { UserID: number; PartnerID?: number; ProjectID?: number; LastReadID: number }[] = [];
    for (const project of projects) {
        const list = sent.filter((message) => message.project === project.name);
        for (const member of project.members) {
            const LastReadID = lastRead(list, member, project.name);
            if (LastReadID) reads.push({ UserID: users[member], ProjectID: projectIDs[project.name], LastReadID });
        }
    }
    const pairs = new Set(directChats.map(([sender, recipient]) => [sender, recipient].sort().join('/')));
    for (const pair of pairs) {
        const [a, b] = pair.split('/');
        const list = sent.filter((message) => message.recipient && [message.sender, message.recipient].sort().join('/') === pair);
        for (const [reader, partner] of [
            [a, b],
            [b, a],
        ]) {
            const LastReadID = lastRead(list, reader, partner);
            if (LastReadID) reads.push({ UserID: users[reader], PartnerID: users[partner], LastReadID });
        }
    }
    await prisma.chatRead.createMany({ data: reads });

    // example files: drawings, models, cut lists, protocols... for each task (outputs only once it is finished) and
    // documentation for each machine, written to the data folder like uploads
    const writeFile = async (dir: string, name: string, content: string) => {
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(path.join(dir, name), content);
    };
    const taskFiles: { TaskID: number; Kind: 'INPUT' | 'OUTPUT'; Name: string; UploadedAt: Date; UploadedByID: number }[] = [];
    for (const [index, entry] of createdTasks.entries()) {
        const finish = dayjs(entry.task.finish);
        const uploaded = {
            INPUT: dayjs.min(finish.subtract(7, 'day'), dayjs().subtract(1, 'hour')).toDate(),
            OUTPUT: dayjs.min(finish, dayjs().subtract(1, 'hour')).toDate(),
        };
        for (const file of demoTaskFiles(entry.project, entry.task, index)) {
            if (file.kind === 'OUTPUT' && !entry.task.finished) continue;
            const folder = file.kind === 'INPUT' ? 'inputFiles' : 'outputFiles';
            await writeFile(path.join(dataDir(), String(entry.projectID), String(entry.ID), folder), file.name, file.content);
            const uploader = file.kind === 'INPUT' ? entry.project.owner : entry.task.owner;
            taskFiles.push({ TaskID: entry.ID, Kind: file.kind, Name: file.name, UploadedAt: uploaded[file.kind], UploadedByID: users[uploader] });
        }
    }
    await prisma.taskFile.createMany({ data: taskFiles });
    for (const machine of machineList) {
        const ID = machines[machine.Name];
        for (const file of demoMachineFiles(machine.Name, machine.Description, machine.services)) {
            await writeFile(path.join(dataDir(), 'machines', String(ID)), file.name, file.content);
            await prisma.machineFile.create({
                data: { MachineID: ID, Name: file.name, UploadedByID: users[machine.responsible], UploadedAt: inDays(-30, 10) },
            });
        }
    }

    // personal to-do lists
    await prisma.privateTask.createMany({
        data: [
            { UserID: users.jnovak, Name: 'Objednat servis lisu', Description: 'Pravidelná roční prohlídka', FinishDate: inDays(3), Finished: false },
            { UserID: users.jnovak, Name: 'Porada s investorem', Description: 'Zábradlí Olomouc, kontrolní den', FinishDate: inDays(1), Finished: false },
            { UserID: users.jnovak, Name: 'Schválit dovolené', Description: 'Prosinec', FinishDate: inDays(-1), Finished: true },
            { UserID: users.jnovak, Name: 'Plán kapacit na prosinec', Description: 'S Petrou, Ostrava + Pardubice', FinishDate: inDays(2), Finished: false },
            { UserID: users.jnovak, Name: 'Školení BOZP', Description: 'Noví zaměstnanci', FinishDate: inDays(9), Finished: false },
            { UserID: users.pdvorakova, Name: 'Fakturace billboardu', Description: 'Outdoor Media, konečná faktura', FinishDate: inDays(-20), Finished: true },
            { UserID: users.pdvorakova, Name: 'Kontrolní den Tatra', Description: 'Předání plošiny', FinishDate: inDays(5), Finished: false },
            { UserID: users.pdvorakova, Name: 'Poptávka Zlín – 2. etapa', Description: 'Připravit nabídku', FinishDate: inDays(12), Finished: false },
            { UserID: users.lprochazka, Name: 'Kalibrace svářečky', Description: '', FinishDate: inDays(2), Finished: false },
            { UserID: users.tsvoboda, Name: 'Aktualizovat knihovnu profilů', Description: 'Tekla, nové normy', FinishDate: inDays(7), Finished: false },
            { UserID: users.mcerna, Name: 'Revize výkresu zábradlí', Description: 'Výška 1100 mm na 3. patře', FinishDate: inDays(1), Finished: false },
            { UserID: users.okucera, Name: 'Vyčistit filtr laseru', Description: '', FinishDate: inDays(-2), Finished: true },
            { UserID: users.dbenes, Name: 'Objednat pilové pásy', Description: 'Pegas, 2 ks', FinishDate: inDays(-6), Finished: true },
            { UserID: users.pmarek, Name: 'Zkouška svářeče ISO 9606', Description: 'Prodloužení certifikátu', FinishDate: inDays(20), Finished: false },
            { UserID: users.ejelinkova, Name: 'Kalibrace měřidel', Description: 'Posuvky a tloušťkoměr', FinishDate: inDays(4), Finished: false },
            { UserID: users.zkralova, Name: 'Výběrové řízení na hutní materiál', Description: '3 dodavatelé', FinishDate: inDays(6), Finished: false },
        ],
    });
};
