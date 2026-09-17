import { BadRequestException } from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const admin = (id: number) => ({ id, login: `admin${id}`, name: null, role: Role.ADMIN });

describe('UsersService', () => {
  const user = {
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = new UsersService({ user } as unknown as PrismaService);
  const actor: AuthUser = { id: 1, login: 'admin', name: null, role: Role.ADMIN };

  beforeEach(() => {
    jest.clearAllMocks();
    user.update.mockResolvedValue({});
    user.delete.mockResolvedValue({});
  });

  it('не даёт удалить собственную учётную запись', async () => {
    await expect(service.remove(actor.id, actor)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(user.delete).not.toHaveBeenCalled();
  });

  it('не даёт удалить последнего администратора', async () => {
    user.findUnique.mockResolvedValue(admin(2));
    user.count.mockResolvedValue(0);
    await expect(service.remove(2, actor)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(user.delete).not.toHaveBeenCalled();
  });

  it('удаляет администратора, когда есть другой', async () => {
    user.findUnique.mockResolvedValue(admin(2));
    user.count.mockResolvedValue(1);
    await service.remove(2, actor);
    expect(user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it('не даёт изменить собственную роль', async () => {
    user.findUnique.mockResolvedValue(admin(actor.id));
    await expect(
      service.update(actor.id, { role: Role.MANAGER }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(user.update).not.toHaveBeenCalled();
  });

  it('смена пароля и роли отзывает старые токены', async () => {
    user.findUnique.mockResolvedValue({ ...admin(2), role: Role.MANAGER });
    await service.update(2, { password: 'new-password', role: Role.ADMIN }, actor);
    const { data } = user.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data.tokenVersion).toEqual({ increment: 1 });
    expect(data.passwordHash).toEqual(expect.stringMatching(/^\$2[aby]\$/));
  });

  it('переименование токены не трогает', async () => {
    user.findUnique.mockResolvedValue({ ...admin(2), role: Role.MANAGER });
    await service.update(2, { name: 'Айдана' }, actor);
    const { data } = user.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toEqual({ name: 'Айдана' });
  });
});
