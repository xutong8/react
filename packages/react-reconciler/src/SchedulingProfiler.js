/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane.old';
import type {Fiber} from './ReactInternalTypes';
import type {Wakeable} from 'shared/ReactTypes';

import {
  enableNewReconciler,
  enableSchedulingProfiler,
} from 'shared/ReactFeatureFlags';
import ReactVersion from 'shared/ReactVersion';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';

import {getLabelsForLanes as getLabelsForLanes_old} from 'react-reconciler/src/ReactFiberLane.old';
import {getLabelsForLanes as getLabelsForLanes_new} from 'react-reconciler/src/ReactFiberLane.new';

const getLabelsForLanes = enableNewReconciler
  ? getLabelsForLanes_new
  : getLabelsForLanes_old;

/**
 * If performance exists and supports the subset of the User Timing API that we
 * require.
 */
const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function';

let supportsUserTimingV3 = false;
if (enableSchedulingProfiler) {
  if (supportsUserTiming) {
    const CHECK_V3_MARK = '__v3';
    const markOptions = {};
    // $FlowFixMe: Ignore Flow complaining about needing a value
    Object.defineProperty(markOptions, 'startTime', {
      get: function() {
        supportsUserTimingV3 = true;
        return 0;
      },
      set: function() {},
    });

    try {
      // $FlowFixMe: Flow expects the User Timing level 2 API.
      performance.mark(CHECK_V3_MARK, markOptions);
    } catch (error) {
      // Ignore
    } finally {
      performance.clearMarks(CHECK_V3_MARK);
    }
  }
}

export function formatLanes(laneOrLanes: Lane | Lanes): string {
  let labels = getLabelsForLanes(laneOrLanes);
  if (labels != null) {
    labels = labels.sort().join(',');
  } else {
    labels = '';
  }
  return `${laneOrLanes}-${labels}`;
}

function markAndClear(name) {
  performance.mark(name);
  performance.clearMarks(name);
}

// Create a mark on React initialization
if (enableSchedulingProfiler) {
  if (supportsUserTimingV3) {
    markAndClear(`--react-init-${ReactVersion}`);
  }
}

export function markCommitStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear(`--commit-start-${formatLanes(lanes)}`);
    }
  }
}

export function markCommitStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear('--commit-stop');
    }
  }
}

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

// $FlowFixMe: Flow cannot handle polymorphic WeakMaps
const wakeableIDs: WeakMap<Wakeable, number> = new PossiblyWeakMap();
let wakeableID: number = 0;
function getWakeableID(wakeable: Wakeable): number {
  if (!wakeableIDs.has(wakeable)) {
    wakeableIDs.set(wakeable, wakeableID++);
  }
  return ((wakeableIDs.get(wakeable): any): number);
}

export function markComponentSuspended(
  fiber: Fiber,
  wakeable: Wakeable,
  lanes: Lanes,
): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      const eventType = wakeableIDs.has(wakeable) ? 'resuspend' : 'suspend';
      const id = getWakeableID(wakeable);
      const componentName = getComponentNameFromFiber(fiber) || 'Unknown';
      const phase = fiber.alternate === null ? 'mount' : 'update';
      // TODO (scheduling profiler) Add component stack id if we re-add component stack info.
      markAndClear(
        `--suspense-${eventType}-${id}-${componentName}-${phase}-${formatLanes(
          lanes,
        )}`,
      );
      wakeable.then(
        () => markAndClear(`--suspense-resolved-${id}-${componentName}`),
        () => markAndClear(`--suspense-rejected-${id}-${componentName}`),
      );
    }
  }
}

export function markLayoutEffectsStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear(`--layout-effects-start-${formatLanes(lanes)}`);
    }
  }
}

export function markLayoutEffectsStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear('--layout-effects-stop');
    }
  }
}

export function markPassiveEffectsStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear(`--passive-effects-start-${formatLanes(lanes)}`);
    }
  }
}

export function markPassiveEffectsStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear('--passive-effects-stop');
    }
  }
}

export function markRenderStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear(`--render-start-${formatLanes(lanes)}`);
    }
  }
}

export function markRenderYielded(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear('--render-yield');
    }
  }
}

export function markRenderStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear('--render-stop');
    }
  }
}

export function markRenderScheduled(lane: Lane): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      markAndClear(`--schedule-render-${formatLanes(lane)}`);
    }
  }
}

export function markForceUpdateScheduled(fiber: Fiber, lane: Lane): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      const componentName = getComponentNameFromFiber(fiber) || 'Unknown';
      // TODO Add component stack id
      markAndClear(
        `--schedule-forced-update-${formatLanes(lane)}-${componentName}`,
      );
    }
  }
}

export function markStateUpdateScheduled(fiber: Fiber, lane: Lane): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTimingV3) {
      const componentName = getComponentNameFromFiber(fiber) || 'Unknown';
      // TODO Add component stack id
      markAndClear(
        `--schedule-state-update-${formatLanes(lane)}-${componentName}`,
      );
    }
  }
}
