import React, { createRef } from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import TestRenderer from 'react-test-renderer';
import { intersectionObserver } from '@shopify/jest-dom-mocks';
import { renderHook } from '@testing-library/react-hooks';
import { useIntersection } from '..';

beforeEach(() => {
  intersectionObserver.mock();
});

afterEach(() => {
  intersectionObserver.restore();
});

describe('useIntersection', () => {
  const container = document.createElement('div');
  let targetRef;

  it('should be defined', () => {
    expect(useIntersection).toBeDefined();
  });

  it('should setup an IntersectionObserver targeting the ref element and using the options provided', () => {
    TestUtils.act(() => {
      targetRef = createRef();
      ReactDOM.render(<div ref={targetRef} />, container);
    });

    expect(intersectionObserver.observers).toHaveLength(0);
    const observerOptions = { root: null, threshold: 0.8 };

    renderHook(() => useIntersection(targetRef, observerOptions));

    expect(intersectionObserver.observers).toHaveLength(1);
    expect(intersectionObserver.observers[0].target).toEqual(targetRef.current);
    expect(intersectionObserver.observers[0].options).toEqual(observerOptions);
  });

  it('should return null if a ref without a current value is provided', () => {
    targetRef = createRef();

    const { result } = renderHook(() => useIntersection(targetRef, { root: null, threshold: 1 }));
    expect(result.current).toBe(null);
  });

  it('should return the first IntersectionObserverEntry when the IntersectionObserver registers an intersection', () => {
    TestUtils.act(() => {
      targetRef = createRef();
      ReactDOM.render(<div ref={targetRef} />, container);
    });

    const { result } = renderHook(() => useIntersection(targetRef, { root: container, threshold: 0.8 }));

    const mockIntersectionObserverEntry = {
      boundingClientRect: targetRef.current.getBoundingClientRect(),
      intersectionRatio: 0.81,
      intersectionRect: container.getBoundingClientRect(),
      isIntersecting: true,
      rootBounds: container.getBoundingClientRect(),
      target: targetRef.current,
      time: 300,
    };
    TestRenderer.act(() => {
      intersectionObserver.simulate(mockIntersectionObserverEntry);
    });

    expect(result.current).toEqual(mockIntersectionObserverEntry);
  });

  it('should setup a new IntersectionObserver when the ref changes', () => {
    let newRef;
    TestUtils.act(() => {
      targetRef = createRef();
      newRef = createRef();
      ReactDOM.render(
        <div ref={targetRef}>
          <span ref={newRef} />
        </div>,
        container
      );
    });

    const observerOptions = { root: null, threshold: 0.8 };
    const { rerender } = renderHook(({ ref, options }) => useIntersection(ref, options), {
      initialProps: { ref: targetRef, options: observerOptions },
    });

    expect(intersectionObserver.observers[0].target).toEqual(targetRef.current);

    TestRenderer.act(() => {
      rerender({ ref: newRef, options: observerOptions });
    });

    expect(intersectionObserver.observers[0].target).toEqual(newRef.current);
  });

  it('should setup a new IntersectionObserver when the options change', () => {
    TestUtils.act(() => {
      targetRef = createRef();
      ReactDOM.render(<div ref={targetRef} />, container);
    });

    const initialObserverOptions = { root: null, threshold: 0.8 };
    const { rerender } = renderHook(({ ref, options }) => useIntersection(ref, options), {
      initialProps: { ref: targetRef, options: initialObserverOptions },
    });

    expect(intersectionObserver.observers[0].options).toEqual(initialObserverOptions);

    const newObserverOptions = { root: container, threshold: 1 };
    TestRenderer.act(() => {
      rerender({ ref: targetRef, options: newObserverOptions });
    });

    expect(intersectionObserver.observers[0].options).toEqual(newObserverOptions);
  });
});
