// The shapes of the data the backend's API sends (backend/prisma/schema.prisma, dates as ISO strings). Relations are
// optional: each endpoint includes only some of them (see backend/src/resources).

export type ID = number;
export type DateString = string;

export type UserType = 'ADMIN' | 'MANAGER' | 'USER';

// what the API shows of someone in lists (backend/src/access.ts publicUserSelect)
export interface PublicUser {
    ID: ID;
    FirstName: string;
    LastName: string;
    UserName?: string;
    Position?: string;
    UserType?: UserType;
}

export interface User extends PublicUser {
    UserName: string;
    Position: string;
    UserType: UserType;
    Enabled: boolean;
    WorkStartTime?: DateString | null;
    Deleted?: boolean;
    CurrentTaskID?: ID | null;
    CurrentTask?: Task | null;
    ManagerID?: ID | null;
    Manager?: PublicUser | null;
    Subordinates?: PublicUser[];
}

export interface PrivateTask {
    ID: ID;
    Name: string;
    Description: string;
    FinishDate: DateString;
    Finished: boolean;
    UserID: ID;
}

export interface TimeSpan {
    ID: ID;
    StartTime: DateString;
    StopTime: DateString | null;
    UserID: ID;
}

export interface UserTaskTime extends TimeSpan {
    TaskID: ID;
    Task?: Task;
    User?: PublicUser;
}

export interface Task {
    ID: ID;
    Name: string;
    Description?: string | null;
    FinishDate: DateString;
    Finished: boolean;
    DurationHours: number;
    DurationMinutes: number;
    XPosition: number;
    YPosition: number;
    Size: number;
    OwnerID: ID;
    Owner?: PublicUser;
    ProjectID: ID;
    Project?: Partial<Project> & { Name: string };
    MachineID?: ID | null;
    Machine?: Machine | null;
    Predecessors?: TaskDependency[];
    Successors?: TaskDependency[];
    WorkingUsers?: PublicUser[];
    UserTaskTime?: UserTaskTime[];
    Files?: TaskFile[];
}

export type TaskFileKind = 'INPUT' | 'OUTPUT';

export interface StoredFile {
    ID: ID;
    Name: string;
    UploadedAt: DateString;
    UploadedByID?: ID | null;
    UploadedBy?: PublicUser | null;
    // added by the API: the file's size in bytes
    Size?: number;
}

export interface TaskFile extends StoredFile {
    TaskID: ID;
    Kind: TaskFileKind;
}

export interface MachineFile extends StoredFile {
    MachineID: ID;
}

export interface TaskDependency {
    ID: ID;
    ProjectID: ID;
    PredecessorID: ID;
    SuccessorID: ID;
}

export interface Machine {
    ID: ID;
    Name: string;
    Description?: string | null;
    Deleted?: boolean;
    ResponsibleID?: ID | null;
    Responsible?: PublicUser | null;
    Task?: Task[];
    Services?: MachineService[];
    Files?: MachineFile[];
}

export interface MachineService {
    ID: ID;
    MachineID: ID;
    Date: DateString;
    Done: boolean;
    Title: string;
    Note?: string | null;
    CreatedAt: DateString;
    CreatedByID?: ID | null;
    CreatedBy?: PublicUser | null;
}

export interface TaskSummary {
    ID: ID;
    Name: string;
    ProjectID: ID;
    FinishDate: DateString;
    Finished: boolean;
    Project?: { Name: string };
}

export interface MaterialRequest {
    ID: ID;
    Name: string;
    Description?: string | null;
    Count: number;
    Price: number;
    AddedDate: DateString;
    NeededDate?: DateString | null;
    AcceptedDate?: DateString | null;
    AcceptedByID?: ID | null;
    AcceptedBy?: PublicUser | null;
    TargetTaskID?: ID | null;
    TargetTask?: TaskSummary | null;
    TargetUserID: ID;
    TargetUser?: PublicUser;
    MaterialID?: ID | null;
    Material?: Pick<Material, 'ID' | 'Name' | 'Unit'> | null;
}

export type EventType = 'ADD' | 'REMOVE' | 'RESERVATION' | 'RELEASE';

export interface MaterialEvent {
    ID: ID;
    Count: number;
    TargetTaskID?: ID | null;
    TargetTask?: TaskSummary | null;
    TargetUserID?: ID | null;
    TargetUser?: PublicUser | null;
    MaterialID: ID;
    EventType: EventType;
    CreatedAt: DateString;
}

// how many are in stock, reserved and available (computed by the API, backend/src/resources/material.ts)
export interface Stock {
    Count: number;
    Reserved: number;
    Available: number;
}

export interface Material extends Stock {
    ID: ID;
    Name: string;
    Description?: string | null;
    Unit: string;
    Price: number;
    Supplier?: string | null;
    Location?: string | null;
    MinCount: number;
    MaterialEvent?: MaterialEvent[];
}

// one open reservation (GET /auth/material/reservations and a material's detail)
export interface Reservation {
    Key: string;
    Material: Pick<Material, 'ID' | 'Name' | 'Unit' | 'Price'>;
    Task: TaskSummary | null;
    Reserved: number;
    Taken: number;
    Released: number;
    Open: number;
    ReservedAt: DateString;
    ReservedBy: PublicUser[];
}

// GET /auth/material/:id
export interface MaterialDetail extends Material {
    Events: MaterialEvent[];
    Reservations: Reservation[];
    Requests: MaterialRequest[];
}

export interface Project {
    ID: ID;
    Name: string;
    Description?: string | null;
    Customer?: string | null;
    FinishDate?: DateString | null;
    Finished: boolean;
    Deleted?: boolean;
    OwnerID: ID;
    Owner?: PublicUser;
    Member?: { UserID: ID; User?: PublicUser }[];
    Task?: Task[];
    TaskDependency?: TaskDependency[];
}

export interface ChatMessage {
    ID: ID;
    SenderID: ID;
    Sender?: PublicUser;
    RecipientID?: ID | null;
    ProjectID?: ID | null;
    Text: string;
    SentAt: DateString;
}

// a message for the top-right notifications (components/Notifications)
export interface NotificationItem {
    id: Date;
    text: string;
    type: string;
}

// a stored file as the file lists send it (GET .../files, backend/src/resources/tasks.ts)
export interface FileEntry {
    file: string;
    // size in MB, as text ("1.2")
    size: string;
    // when it was uploaded
    details: DateString;
    Bytes: number;
    UploadedBy?: PublicUser | null;
}

// a project in the projects list (GET /auth/projects): Mine = the user owns it or is a member, WorkingSince = the
// earliest running timer on one of its tasks
export interface ProjectListItem extends Project {
    Mine?: boolean;
    WorkingSince?: DateString | null;
}

// the counts the backend adds to a task (taskProgressCount, see components/ui/taskStatus)
export interface TaskCounts {
    _count?: { Successors?: number; WorkingUsers?: number; UserTaskTime?: number };
}

export type TaskWithProgress = Task & TaskCounts;

// one of the user's assigned tasks (GET /auth/:userID/tasks)
export interface AssignedTaskRow {
    ID: ID;
    TaskID: ID;
    Task: TaskWithProgress;
}

// a user with their week (GET /auth/users/:id?weekStart=...): the work time of that week and the tasks they work on
export interface UserWithWeek extends User {
    WorkTime: TimeSpan[];
    User_Task?: { Task: TaskWithProgress }[];
}

// a machine in the machines list (GET /auth/machines): its last done and next planned service, how many unfinished
// tasks it has
export interface MachineListItem extends Machine {
    LastService?: MachineService | null;
    NextService?: MachineService | null;
    OpenTasks?: number;
}

// one machine (GET /auth/machines/:id): its tasks, services and how many files it has
export interface MachineDetail extends MachineListItem {
    Task: TaskWithProgress[];
    Services: MachineService[];
    FileCount?: number;
}

// statistics (backend/src/resources/stats.ts): one task a person logged time on in the period
export interface StatsTask extends TaskCounts {
    ID: ID;
    Name: string;
    Finished: boolean;
    FinishDate: DateString;
    Project: { ID: ID; Name: string };
    // the person's part of the plan (null: no estimate, or not assigned)
    PlannedMinutes: number | null;
    PeriodMinutes: number;
    TotalMinutes: number;
}

// GET /auth/stats/users/:id
export interface PersonStatsData {
    User: User;
    WorkedMinutes: number;
    WorkTime: { StartTime: DateString; StopTime: DateString }[];
    Tasks: StatsTask[];
}

// GET /auth/stats/people: one row per person
export interface PersonTotals {
    User: User;
    WorkedMinutes: number;
    TaskMinutes: number;
    TaskCount: number;
    FinishedCount: number;
    PlannedMinutes: number;
    ActualMinutes: number;
}

// one project (GET /auth/projects/:id): its owner and members
export interface ProjectDetail extends Omit<ProjectListItem, 'Owner' | 'Member'> {
    Owner: PublicUser;
    Member: { UserID?: ID; User: PublicUser }[];
}

// GET /auth/projects/:id/stats: planned (the tasks' estimates) against logged time, per worker and per task
export interface ProjectStatsData {
    PlannedMinutes: number;
    ActualMinutes: number;
    Workers: { User: User; PlannedMinutes: number; ActualMinutes: number; TaskCount: number }[];
    Tasks: (TaskCounts & {
        ID: ID;
        Name: string;
        Finished: boolean;
        FinishDate: DateString;
        Workers: PublicUser[];
        PlannedMinutes: number;
        ActualMinutes: number;
    })[];
}

// GET /auth/projects/:id/files: every file of the project's tasks, with its kind and task
export interface ProjectFileEntry extends FileEntry {
    Kind: 'input' | 'output';
    Task: { ID: ID; Name: string };
}

// one task (GET /auth/projects/:projectID/tasks/:taskID): who works on it, the tasks before and after it (Successors
// holds the dependencies where it is the successor, so their Predecessor is a previous task) and its tab counts
export interface TaskDetail extends TaskWithProgress {
    User_Task: { User: PublicUser }[];
    Successors?: (TaskDependency & { Predecessor: TaskWithProgress })[];
    Predecessors?: (TaskDependency & { Successor: TaskWithProgress })[];
    Counts?: Record<string, number>;
}
