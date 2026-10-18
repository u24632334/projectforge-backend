const DevelopmentUpdateRepository =
    require("../db/developmentUpdateRepository");


describe(
    "DevelopmentUpdateRepository",
    () => {
        let repository;
        let pool;


        beforeEach(() => {
            pool = {
                query: jest.fn()
            };

            repository =
                new DevelopmentUpdateRepository(
                    pool
                );
        });


        describe(
            "create",
            () => {
                test(
                    "inserts a development update and returns the created row",
                    async () => {
                        const update = {
                            updateId:
                                "update-1",

                            membershipId:
                                "membership-1",

                            content:
                                "Completed the authentication module."
                        };


                        const databaseRow = {
                            update_id:
                                "update-1",

                            author_membership_id:
                                "membership-1",

                            content:
                                "Completed the authentication module.",

                            created_at:
                                new Date()
                        };


                        pool.query
                            .mockResolvedValue({
                                rows: [
                                    databaseRow
                                ]
                            });


                        const result =
                            await repository
                                .create(
                                    update
                                );


                        expect(
                            pool.query
                        ).toHaveBeenCalledWith(
                            expect.stringContaining(
                                "INSERT INTO development_updates"
                            ),
                            [
                                update.updateId,
                                update.membershipId,
                                update.content
                            ]
                        );


                        expect(
                            result
                        ).toEqual(
                            databaseRow
                        );
                    }
                );
            }
        );


        describe(
            "findByProject",
            () => {
                test(
                    "returns development updates with author and project details",
                    async () => {
                        const databaseRows = [
                            {
                                update_id:
                                    "update-1",

                                author_membership_id:
                                    "membership-1",

                                author_user_id:
                                    "user-1",

                                author_display_name:
                                    "Alex Student",

                                project_id:
                                    "project-1",

                                content:
                                    "Completed authentication.",

                                created_at:
                                    "2026-10-08T08:00:00.000Z"
                            }
                        ];


                        pool.query
                            .mockResolvedValue({
                                rows:
                                    databaseRows
                            });


                        const result =
                            await repository
                                .findByProject(
                                    "project-1"
                                );


                        expect(
                            pool.query
                        ).toHaveBeenCalledWith(
                            expect.stringContaining(
                                "WHERE pm.project_id = $1"
                            ),
                            [
                                "project-1"
                            ]
                        );


                        const queryText =
                            pool.query.mock
                                .calls[0][0];


                        expect(
                            queryText
                        ).toContain(
                            "pm.user_id AS author_user_id"
                        );


                        expect(
                            queryText
                        ).toContain(
                            "p.display_name AS author_display_name"
                        );


                        expect(
                            queryText
                        ).toContain(
                            "pm.active = TRUE"
                        );


                        expect(
                            result
                        ).toEqual(
                            databaseRows
                        );
                    }
                );


                test(
                    "returns an empty array when the project has no updates",
                    async () => {
                        pool.query
                            .mockResolvedValue({
                                rows: []
                            });


                        const result =
                            await repository
                                .findByProject(
                                    "project-1"
                                );


                        expect(
                            result
                        ).toEqual([]);
                    }
                );
            }
        );


        describe(
            "findById",
            () => {
                test(
                    "returns the development update with author and project details when it exists",
                    async () => {
                        const databaseRow = {
                            update_id:
                                "update-1",

                            author_membership_id:
                                "membership-1",

                            author_user_id:
                                "user-1",

                            author_display_name:
                                "Alex Student",

                            project_id:
                                "project-1",

                            content:
                                "Completed authentication."
                        };


                        pool.query
                            .mockResolvedValue({
                                rows: [
                                    databaseRow
                                ]
                            });


                        const result =
                            await repository
                                .findById(
                                    "update-1"
                                );


                        expect(
                            pool.query
                        ).toHaveBeenCalledWith(
                            expect.stringContaining(
                                "WHERE du.update_id = $1"
                            ),
                            [
                                "update-1"
                            ]
                        );


                        const queryText =
                            pool.query.mock
                                .calls[0][0];


                        expect(
                            queryText
                        ).toContain(
                            "pm.user_id AS author_user_id"
                        );


                        expect(
                            queryText
                        ).toContain(
                            "p.display_name AS author_display_name"
                        );


                        expect(
                            result
                        ).toEqual(
                            databaseRow
                        );
                    }
                );


                test(
                    "returns null when the development update does not exist",
                    async () => {
                        pool.query
                            .mockResolvedValue({
                                rows: []
                            });


                        const result =
                            await repository
                                .findById(
                                    "missing-update"
                                );


                        expect(
                            result
                        ).toBeNull();
                    }
                );
            }
        );


        describe(
            "update",
            () => {
                test(
                    "updates the development update and returns the updated row",
                    async () => {
                        const update = {
                            updateId:
                                "update-1",

                            content:
                                "Updated progress."
                        };


                        const databaseRow = {
                            update_id:
                                "update-1",

                            author_membership_id:
                                "membership-1",

                            content:
                                "Updated progress."
                        };


                        pool.query
                            .mockResolvedValue({
                                rows: [
                                    databaseRow
                                ]
                            });


                        const result =
                            await repository
                                .update(
                                    update
                                );


                        expect(
                            pool.query
                        ).toHaveBeenCalledWith(
                            expect.stringContaining(
                                "UPDATE development_updates"
                            ),
                            [
                                update.content,
                                update.updateId
                            ]
                        );


                        expect(
                            result
                        ).toEqual(
                            databaseRow
                        );
                    }
                );


                test(
                    "returns null when the development update does not exist",
                    async () => {
                        const update = {
                            updateId:
                                "missing-update",

                            content:
                                "Updated progress."
                        };


                        pool.query
                            .mockResolvedValue({
                                rows: []
                            });


                        const result =
                            await repository
                                .update(
                                    update
                                );


                        expect(
                            result
                        ).toBeNull();
                    }
                );
            }
        );
    }
);