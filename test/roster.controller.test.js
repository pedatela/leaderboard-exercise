import { jest } from '@jest/globals';
import { RosterController } from '../src/controllers/roster.controller.js';
import { RosterService } from '../src/service/roster.service.js';

describe('RosterController', () => {
  let controller;
  let getOrgRoster;
  let res;
  let next;

  beforeEach(() => {
    controller = new RosterController();
    getOrgRoster = jest.spyOn(RosterService.prototype, 'getOrgRoster');
    res = {
      locals: { validated: { params: { orgId: 1 } } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it('passes a numeric organization ID to the service and sends its response', async () => {
    const roster = { organization_id: 1, learners: [] };
    getOrgRoster.mockResolvedValue(roster);

    await controller.getOrgRoster({ params: { orgId: '1' } }, res, next);

    expect(getOrgRoster).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({
      data: roster,
      error: false,
      code: 0,
      msg: 'Request completed successfully.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards service failures to the error middleware', async () => {
    const error = new Error('Database unavailable');
    getOrgRoster.mockRejectedValue(error);

    await controller.getOrgRoster({ params: { orgId: '1' } }, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
