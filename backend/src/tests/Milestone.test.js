const { Milestone, MILESTONE_STATUS } = require('../models/Milestone');

describe('Milestone', () => {

    describe('UpdateDueDate', () => {

        test('updates the due date when given a valid date', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            const result = milestone.UpdateDueDate('2026-10-15');

            expect(result).toBe(true);
            expect(milestone.dueDate).toBe('2026-10-15');
        });

        test('rejects an invalid date', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            const result = milestone.UpdateDueDate('not-a-date');

            expect(result).toBe(false);
            expect(milestone.dueDate).toBe(null);
        });

        test('allows the due date to be cleared', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description',
                dueDate: '2026-10-15'
            });

            const result = milestone.UpdateDueDate(null);

            expect(result).toBe(true);
            expect(milestone.dueDate).toBe(null);
        });
    });


    describe('MarkComplete', () => {

        test('changes an open milestone to complete', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            const result = milestone.MarkComplete();

            expect(result).toBe(true);
            expect(milestone.status).toBe(MILESTONE_STATUS.COMPLETE);
        });

        test('rejects completing an already completed milestone', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description',
                status: MILESTONE_STATUS.COMPLETE
            });

            const result = milestone.MarkComplete();

            expect(result).toBe(false);
            expect(milestone.status).toBe(MILESTONE_STATUS.COMPLETE);
        });
    });


    describe('Reopen', () => {

        test('changes a completed milestone back to open', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description',
                status: MILESTONE_STATUS.COMPLETE
            });

            const result = milestone.Reopen();

            expect(result).toBe(true);
            expect(milestone.status).toBe(MILESTONE_STATUS.OPEN);
        });

        test('rejects reopening an already open milestone', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            const result = milestone.Reopen();

            expect(result).toBe(false);
            expect(milestone.status).toBe(MILESTONE_STATUS.OPEN);
        });
    });


    describe('IsValidDate', () => {

        test('accepts a valid calendar date', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            expect(milestone.IsValidDate('2026-12-31')).toBe(true);
        });

        test('rejects an impossible calendar date', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            expect(milestone.IsValidDate('2026-02-30')).toBe(false);
        });

        test('rejects an incorrectly formatted date', () => {
            const milestone = new Milestone({
                projectId: 'project-1',
                title: 'Test milestone',
                description: 'Test description'
            });

            expect(milestone.IsValidDate('31-12-2026')).toBe(false);
        });
    });
});