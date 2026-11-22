// Example data for development and demos (see seed.ts): a small engineering company with three projects.
// Dates are relative to today, so the charts on the overview always show the current week.
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import prisma from './client.ts';
import { hashPassword } from './auth.ts';

dayjs.extend(isoWeek);

export const DEMO_PASSWORD = 'demo1234';

// a day of the current week (1 = Monday) at the given hour
const thisWeek = (isoDay: number, hour: number, minute = 0) => dayjs().isoWeekday(isoDay).hour(hour).minute(minute).second(0).millisecond(0).toDate();
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
    ];
    const users: Record<string, number> = {};
    for (const person of people) {
        const user = await prisma.user.create({ data: { ...person, PasswordHash: passwordHash, Enabled: true } });
        users[person.UserName] = user.ID;
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
    ];

    const taskIDs: Record<string, number> = {};
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
    ];
    for (const material of materialList) {
        await prisma.material.create({
            data: {
                Name: material.Name,
                Description: material.Description,
                MaterialEvent: {
                    create: material.events.map((event) => ({
                        EventType: event.EventType,
                        Count: event.Count,
                        TargetTaskID: event.task ?? null,
                        TargetUserID: users.jnovak,
                    })),
                },
            },
        });
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
        ],
    });

    // everyone's worked hours this week, up to today (the "Odpracovaný čas" chart)
    const today = dayjs().isoWeekday();
    const workers = ['jnovak', 'pdvorakova', 'tsvoboda', 'mcerna', 'lprochazka', 'okucera', 'kvesela'];
    for (let day = 1; day <= Math.min(today, 5); day++) {
        for (const [index, worker] of workers.entries()) {
            // today only the morning, so the chart doesn't run ahead of the clock
            const end = day === today ? Math.min(12, dayjs().hour()) : 14 + ((day + index) % 3);
            if (end <= 6) continue;
            await prisma.workTime.create({ data: { UserID: users[worker], StartTime: thisWeek(day, 6, (index * 7) % 30), StopTime: thisWeek(day, end, 30) } });
        }
    }

    // personal to-do lists
    await prisma.privateTask.createMany({
        data: [
            { UserID: users.jnovak, Name: 'Objednat servis lisu', Description: 'Pravidelná roční prohlídka', FinishDate: inDays(3), Finished: false },
            { UserID: users.jnovak, Name: 'Porada s investorem', Description: 'Zábradlí Olomouc, kontrolní den', FinishDate: inDays(1), Finished: false },
            { UserID: users.jnovak, Name: 'Schválit dovolené', Description: 'Prosinec', FinishDate: inDays(-1), Finished: true },
            { UserID: users.lprochazka, Name: 'Kalibrace svářečky', Description: '', FinishDate: inDays(2), Finished: false },
        ],
    });
};
