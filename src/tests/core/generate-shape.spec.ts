import {
  GenerateShapeUseCase,
  ShapeName,
} from '@/core/use-cases/generate-shape.use-case';
import { Container, Graphics } from 'pixi.js-legacy';

describe('GenerateShapeUseCase (TDD/Unit)', () => {
  let useCase: GenerateShapeUseCase;
  let mockContainer: Container;

  beforeEach(() => {
    useCase = new GenerateShapeUseCase();
    mockContainer = new Container();
  });

  it('должен добавить ровно один дочерний элемент в контейнер', () => {
    useCase.execute(mockContainer);

    expect(mockContainer.children.length).toBe(1);
  });

  it('добавленный элемент должен быть графическим объектом (Graphics)', () => {
    useCase.execute(mockContainer);
    const addedChild = mockContainer.children[0];

    expect(addedChild).toBeInstanceOf(Graphics);
  });

  it('фигуре должно быть присвоено корректное имя для распознавания транслятором', () => {
    const useCase = new GenerateShapeUseCase();
    const mockContainer = new Container();

    useCase.execute(mockContainer);

    const [addedChild] = mockContainer.children;
    if (!addedChild) {
      throw new Error('Фигура не была добавлена в контейнер');
    }
    const validNames = Object.values(ShapeName);

    expect(validNames).toContain(addedChild.name);
  });
});
