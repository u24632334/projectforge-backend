const MilestoneService =
    require(
        "../services/MilestoneService"
    );


describe(
    "MilestoneService",
    () => {

        let service;
        let repository;


        beforeEach(
            () => {
                repository = {
                    create:
                        jest.fn(),

                    findByProject:
                        jest.fn(),

                    findById:
                        jest.fn(),

                    update:
                        jest.fn()
                };


                service =
                    new MilestoneService(
                        repository
                    );
            }
        );


        describe(
            "CreateMilestone",
            () => {

                test(
                    "creates a milestone and saves it through the repository",
                    async () => {

                        const data = {
                            projectId:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete project planning",

                            dueDate:
                                "2099-12-31"
                        };


                        const savedMilestone = {
                            milestone_id:
                                "milestone-1",

                            project_id:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete project planning",

                            due_date:
                                "2099-12-31",

                            status:
                                "OPEN"
                        };


                        repository
                            .create
                            .mockResolvedValue(
                                savedMilestone
                            );


                        const result =
                            await service
                                .CreateMilestone(
                                    data
                                );


                        expect(
                            repository.create
                        ).toHaveBeenCalledTimes(
                            1
                        );


                        expect(
                            repository.create
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                projectId:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete project planning",

                                dueDate:
                                    "2099-12-31",

                                status:
                                    "OPEN"
                            })
                        );


                        expect(
                            result
                        ).toEqual(
                            savedMilestone
                        );
                    }
                );

            }
        );


        describe(
            "GetMilestonesByProject",
            () => {

                test(
                    "returns milestones belonging to a project",
                    async () => {

                        const milestones = [
                            {
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1"
                            },

                            {
                                milestone_id:
                                    "milestone-2",

                                project_id:
                                    "project-1"
                            }
                        ];


                        repository
                            .findByProject
                            .mockResolvedValue(
                                milestones
                            );


                        const result =
                            await service
                                .GetMilestonesByProject(
                                    "project-1"
                                );


                        expect(
                            repository.findByProject
                        ).toHaveBeenCalledWith(
                            "project-1"
                        );


                        expect(
                            result
                        ).toEqual(
                            milestones
                        );
                    }
                );

            }
        );


        describe(
            "GetMilestone",
            () => {

                test(
                    "returns a milestone by ID",
                    async () => {

                        const milestone = {
                            milestone_id:
                                "milestone-1",

                            project_id:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete planning",

                            due_date:
                                "2099-12-31",

                            status:
                                "OPEN"
                        };


                        repository
                            .findById
                            .mockResolvedValue(
                                milestone
                            );


                        const result =
                            await service
                                .GetMilestone(
                                    "milestone-1"
                                );


                        expect(
                            repository.findById
                        ).toHaveBeenCalledWith(
                            "milestone-1"
                        );


                        expect(
                            result
                        ).toEqual(
                            milestone
                        );
                    }
                );

            }
        );


        describe(
            "UpdateDueDate",
            () => {

                test(
                    "updates the due date of an existing milestone",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-30",

                                status:
                                    "OPEN"
                            });


                        const updatedMilestone = {
                            milestone_id:
                                "milestone-1",

                            project_id:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete planning",

                            due_date:
                                "2099-12-31",

                            status:
                                "OPEN"
                        };


                        repository
                            .update
                            .mockResolvedValue(
                                updatedMilestone
                            );


                        const result =
                            await service
                                .UpdateDueDate(
                                    "milestone-1",
                                    "2099-12-31"
                                );


                        expect(
                            repository.findById
                        ).toHaveBeenCalledWith(
                            "milestone-1"
                        );


                        expect(
                            repository.update
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                milestoneId:
                                    "milestone-1",

                                dueDate:
                                    "2099-12-31"
                            })
                        );


                        expect(
                            result
                        ).toEqual(
                            updatedMilestone
                        );
                    }
                );


                test(
                    "rejects an invalid due date",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-30",

                                status:
                                    "OPEN"
                            });


                        const result =
                            await service
                                .UpdateDueDate(
                                    "milestone-1",
                                    "not-a-date"
                                );


                        expect(
                            result
                        ).toBe(
                            false
                        );


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "returns null when the milestone does not exist",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue(
                                null
                            );


                        const result =
                            await service
                                .UpdateDueDate(
                                    "missing-milestone",
                                    "2099-12-31"
                                );


                        expect(
                            result
                        ).toBeNull();


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );

            }
        );


        describe(
            "MarkMilestoneComplete",
            () => {

                test(
                    "completes an open milestone belonging to the authorised project",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "OPEN"
                            });


                        const completedMilestone = {
                            milestone_id:
                                "milestone-1",

                            project_id:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete planning",

                            due_date:
                                "2099-12-31",

                            status:
                                "COMPLETE"
                        };


                        repository
                            .update
                            .mockResolvedValue(
                                completedMilestone
                            );


                        const result =
                            await service
                                .MarkMilestoneComplete(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            repository.update
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                milestoneId:
                                    "milestone-1",

                                projectId:
                                    "project-1",

                                status:
                                    "COMPLETE"
                            })
                        );


                        expect(
                            result
                        ).toEqual(
                            completedMilestone
                        );
                    }
                );


                test(
                    "rejects a milestone belonging to another project",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-2",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "OPEN"
                            });


                        const result =
                            await service
                                .MarkMilestoneComplete(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBeNull();


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects completing an already complete milestone",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "COMPLETE"
                            });


                        const result =
                            await service
                                .MarkMilestoneComplete(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBe(
                            false
                        );


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "returns null when the milestone does not exist",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue(
                                null
                            );


                        const result =
                            await service
                                .MarkMilestoneComplete(
                                    "missing-milestone",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBeNull();


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );

            }
        );


        describe(
            "ReopenMilestone",
            () => {

                test(
                    "reopens a complete milestone belonging to the authorised project",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "COMPLETE"
                            });


                        const reopenedMilestone = {
                            milestone_id:
                                "milestone-1",

                            project_id:
                                "project-1",

                            title:
                                "Planning",

                            description:
                                "Complete planning",

                            due_date:
                                "2099-12-31",

                            status:
                                "OPEN"
                        };


                        repository
                            .update
                            .mockResolvedValue(
                                reopenedMilestone
                            );


                        const result =
                            await service
                                .ReopenMilestone(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            repository.update
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                milestoneId:
                                    "milestone-1",

                                projectId:
                                    "project-1",

                                status:
                                    "OPEN"
                            })
                        );


                        expect(
                            result
                        ).toEqual(
                            reopenedMilestone
                        );
                    }
                );


                test(
                    "rejects reopening an already open milestone",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-1",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "OPEN"
                            });


                        const result =
                            await service
                                .ReopenMilestone(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBe(
                            false
                        );


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "rejects reopening a milestone belonging to another project",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue({
                                milestone_id:
                                    "milestone-1",

                                project_id:
                                    "project-2",

                                title:
                                    "Planning",

                                description:
                                    "Complete planning",

                                due_date:
                                    "2099-12-31",

                                status:
                                    "COMPLETE"
                            });


                        const result =
                            await service
                                .ReopenMilestone(
                                    "milestone-1",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBeNull();


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );


                test(
                    "returns null when the milestone does not exist",
                    async () => {

                        repository
                            .findById
                            .mockResolvedValue(
                                null
                            );


                        const result =
                            await service
                                .ReopenMilestone(
                                    "missing-milestone",
                                    "project-1"
                                );


                        expect(
                            result
                        ).toBeNull();


                        expect(
                            repository.update
                        ).not.toHaveBeenCalled();
                    }
                );

            }
        );

    }
);