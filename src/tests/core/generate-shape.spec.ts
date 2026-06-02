import { GenerateShapeUseCase } from '@/core/use-cases/generate-shape.use-case';
import * as PIXI from 'pixi.js-legacy';

describe('GenerateShapeUseCase (TDD/Unit)', () => {
  let useCase: GenerateShapeUseCase;
  let mockContainer: PIXI.Container;

  beforeEach(() => {
    useCase = new GenerateShapeUseCase();
    mockContainer = new PIXI.Container();
  });

  it('должен добавить ровно один дочерний элемент в контейнер', () => {
    useCase.execute(mockContainer);

    expect(mockContainer.children.length).toBe(1);
  });

  it('добавленный элемент должен быть графическим объектом (PIXI.Graphics)', () => {
    useCase.execute(mockContainer);
    const addedChild = mockContainer.children[0];

    expect(addedChild).toBeInstanceOf(PIXI.Graphics);
  });

  it('фигуре должно быть присвоено имя для распознавания транслятором', () => {
    useCase.execute(mockContainer);
    const addedChild = mockContainer.children[0];

    expect(addedChild.name).toBe('graphics_rect');
  });
});
