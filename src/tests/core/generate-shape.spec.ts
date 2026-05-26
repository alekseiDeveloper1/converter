import { describe, expect, it, jest } from '@jest/globals';
import { GenerateShapeUseCase } from '@/core/use-cases/generate-shape.use-case';
import type { IVectorRenderer } from '@/core/interfaces/i-vector-renderer';

describe('GenerateShapeUseCase (TDD)', () => {
  it('должен вызывать метод добавления фигуры в рендерер', () => {
    const mockRenderer: jest.Mocked<IVectorRenderer> = {
      addGraphics: jest.fn(),
    };

    const useCase = new GenerateShapeUseCase(mockRenderer);

    useCase.execute();

    expect(mockRenderer.addGraphics).toHaveBeenCalledTimes(1);
  });
});
