const MilestoneRepository = require('../db/milestoneRepository');

describe('MilestoneRepository', () => {
    let repository;
    let pool;

    beforeEach(() => {
        pool = {
            query: jest.fn()
        };

        repository = new MilestoneRepository(pool);
    });

    describe('FormatDueDate', () => {
        test('formats a Date object without shifting the calendar day', () => {
            const date = new Date(2026, 9, 1);

            const result = repository.FormatDueDate(date);

            expect(result).toBe('2026-10-01');
        });

        test('returns a date string unchanged', () => {
            const result = repository.FormatDueDate('2026-10-01');

            expect(result).toBe('2026-10-01');
        });

        test('returns null when the database date is null', () => {
            const result = repository.FormatDueDate(null);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        test('inserts a milestone and returns the created row', async () => {
            const milestone = {
                milestoneId: 'milestone-1',
                projectId: 'project-1',
                title: 'Planning',
                description: 'Complete project planning',
                dueDate: '2026-10-01',
                status: 'OPEN'
            };

            const databaseRow = {
                milestone_id: 'milestone-1',
                project_id: 'project-1',
                title: 'Planning',
                description: 'Complete project planning',
                due_date: new Date(2026, 9, 1),
                status: 'OPEN'
            };

            pool.query.mockResolvedValue({ rows: [databaseRow] });

            const result = await repository.create(milestone);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO milestones'),
                [
                    milestone.milestoneId,
                    milestone.projectId,
                    milestone.title,
                    milestone.description,
                    milestone.dueDate,
                    milestone.status
                ]
            );

            expect(result.due_date).toBe('2026-10-01');
        });
    });

    describe('findByProject', () => {
        test('returns milestones belonging to the project', async () => {
            const databaseRows = [
                {
                    milestone_id: 'milestone-1',
                    project_id: 'project-1',
                    title: 'Planning',
                    description: 'Complete planning',
                    due_date: new Date(2026, 9, 1),
                    status: 'OPEN'
                }
            ];

            pool.query.mockResolvedValue({ rows: databaseRows });

            const result = await repository.findByProject('project-1');

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE project_id = $1'),
                ['project-1']
            );

            expect(result).toHaveLength(1);
            expect(result[0].due_date).toBe('2026-10-01');
        });
    });

    describe('findById', () => {
        test('returns the milestone when it exists', async () => {
            const databaseRow = {
                milestone_id: 'milestone-1',
                project_id: 'project-1',
                title: 'Planning',
                description: 'Complete planning',
                due_date: new Date(2026, 9, 1),
                status: 'OPEN'
            };

            pool.query.mockResolvedValue({ rows: [databaseRow] });

            const result = await repository.findById('milestone-1');

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE milestone_id = $1'),
                ['milestone-1']
            );

            expect(result.due_date).toBe('2026-10-01');
        });

        test('returns null when the milestone does not exist', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const result = await repository.findById('missing-milestone');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        test('updates the milestone and returns the updated row', async () => {
            const milestone = {
                milestoneId: 'milestone-1',
                title: 'Updated Planning',
                description: 'Updated description',
                dueDate: '2026-10-01',
                status: 'COMPLETE'
            };

            const databaseRow = {
                milestone_id: 'milestone-1',
                project_id: 'project-1',
                title: 'Updated Planning',
                description: 'Updated description',
                due_date: new Date(2026, 9, 1),
                status: 'COMPLETE'
            };

            pool.query.mockResolvedValue({ rows: [databaseRow] });

            const result = await repository.update(milestone);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE milestones'),
                [
                    milestone.title,
                    milestone.description,
                    milestone.dueDate,
                    milestone.status,
                    milestone.milestoneId
                ]
            );

            expect(result.due_date).toBe('2026-10-01');
            expect(result.status).toBe('COMPLETE');
        });

        test('returns null when the milestone does not exist', async () => {
            const milestone = {
                milestoneId: 'missing-milestone',
                title: 'Updated Planning',
                description: 'Updated description',
                dueDate: '2026-10-01',
                status: 'OPEN'
            };

            pool.query.mockResolvedValue({ rows: [] });

            const result = await repository.update(milestone);

            expect(result).toBeNull();
        });
    });
});