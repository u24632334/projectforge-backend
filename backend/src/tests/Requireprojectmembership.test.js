const {
    BuildRequireProjectMembership,
    CreateMembershipLookup,
    MEMBER_ROLE
} = require('../middleware/requireProjectMembership');

/**
 * Builds a fake Express response capturing status and JSON body.
 *
 * @returns {Object}
 */
function buildResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

/**
 * Builds a fake authenticated request for a project route.
 *
 * @param {Object} [overrides]
 * @returns {Object}
 */
function buildRequest(overrides = {}) {
    return {
        user: { id: 'user-1', email: 'zaid@tuks.co.za', role: 'STUDENT' },
        params: { id: 'project-1' },
        ...overrides
    };
}

/**
 * Builds an active membership record.
 *
 * @param {Object} [overrides]
 * @returns {Object}
 */
function buildMembership(overrides = {}) {
    return {
        membershipId: 'membership-1',
        projectId: 'project-1',
        userId: 'user-1',
        memberRole: MEMBER_ROLE.MEMBER,
        active: true,
        ...overrides
    };
}

describe('requireProjectMembership middleware', () => {
    describe('successful authorisation', () => {
        test('calls next and attaches the membership for an active member', async () => {
            const findMembership = jest.fn().mockResolvedValue(buildMembership());
            const middleware = BuildRequireProjectMembership(findMembership);

            const req = buildRequest();
            const res = buildResponse();
            const next = jest.fn();

            await middleware(req, res, next);

            expect(findMembership).toHaveBeenCalledWith('project-1', 'user-1');
            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith();
            expect(req.membership.membershipId).toBe('membership-1');
            expect(res.status).not.toHaveBeenCalled();
        });

        test('accepts a projectId route parameter as well as id', async () => {
            const findMembership = jest.fn().mockResolvedValue(buildMembership());
            const middleware = BuildRequireProjectMembership(findMembership);

            const req = buildRequest({ params: { projectId: 'project-1' } });
            const next = jest.fn();

            await middleware(req, buildResponse(), next);

            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('rejected requests', () => {
        test('returns 401 when the request is not authenticated', async () => {
            const findMembership = jest.fn();
            const middleware = BuildRequireProjectMembership(findMembership);

            const req = buildRequest({ user: undefined });
            const res = buildResponse();
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Authentication required.'
            });
            expect(findMembership).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test('returns 400 when no project identifier is present', async () => {
            const findMembership = jest.fn();
            const middleware = BuildRequireProjectMembership(findMembership);

            const res = buildResponse();
            const next = jest.fn();

            await middleware(buildRequest({ params: {} }), res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(findMembership).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test('returns 403 when the user is not a member of the project', async () => {
            const findMembership = jest.fn().mockResolvedValue(null);
            const middleware = BuildRequireProjectMembership(findMembership);

            const res = buildResponse();
            const next = jest.fn();

            await middleware(buildRequest(), res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'You are not a member of this project.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('lead-only routes', () => {
        test('allows the Project Lead through', async () => {
            const findMembership = jest.fn().mockResolvedValue(
                buildMembership({ memberRole: MEMBER_ROLE.LEAD })
            );
            const middleware = BuildRequireProjectMembership(findMembership, {
                requireLead: true
            });

            const next = jest.fn();
            const res = buildResponse();

            await middleware(buildRequest(), res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('returns 403 for an ordinary member on a lead-only route', async () => {
            const findMembership = jest.fn().mockResolvedValue(buildMembership());
            const middleware = BuildRequireProjectMembership(findMembership, {
                requireLead: true
            });

            const res = buildResponse();
            const next = jest.fn();

            await middleware(buildRequest(), res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Project Lead access required.'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        test('forwards a lookup failure to the error handler', async () => {
            const failure = new Error('connection lost');
            const findMembership = jest.fn().mockRejectedValue(failure);
            const middleware = BuildRequireProjectMembership(findMembership);

            const res = buildResponse();
            const next = jest.fn();

            await middleware(buildRequest(), res, next);

            expect(next).toHaveBeenCalledWith(failure);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('CreateMembershipLookup', () => {
        test('queries only active memberships and maps the row', async () => {
            const pool = {
                query: jest.fn().mockResolvedValue({
                    rows: [{
                        membership_id: 'membership-1',
                        project_id: 'project-1',
                        user_id: 'user-1',
                        member_role: 'LEAD',
                        active: true
                    }]
                })
            };

            const lookup = CreateMembershipLookup(pool);
            const result = await lookup('project-1', 'user-1');

            const [sql, params] = pool.query.mock.calls[0];
            expect(sql).toContain('active = TRUE');
            expect(params).toEqual(['project-1', 'user-1']);

            expect(result.membershipId).toBe('membership-1');
            expect(result.memberRole).toBe(MEMBER_ROLE.LEAD);
        });

        test('returns null when the user has no active membership', async () => {
            const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };

            const result = await CreateMembershipLookup(pool)('p', 'u');

            expect(result).toBeNull();
        });
    });
});