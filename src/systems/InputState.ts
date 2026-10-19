/**
 * Single source of player intent, fed by keyboard (GardenScene) and touch (TouchControls).
 * Gameplay reads only this object, so input devices stay interchangeable.
 */
export class InputState {
  /** Held directions from touch controls. */
  touchLeft = false;
  touchRight = false;
  touchUp = false;
  touchDown = false;
  /** Edge-triggered requests; consumed by the reader. */
  private actionQueued = false;
  private pauseQueued = false;

  queueAction() {
    this.actionQueued = true;
  }
  queuePause() {
    this.pauseQueued = true;
  }
  consumeAction(): boolean {
    const v = this.actionQueued;
    this.actionQueued = false;
    return v;
  }
  consumePause(): boolean {
    const v = this.pauseQueued;
    this.pauseQueued = false;
    return v;
  }
  releaseAll() {
    this.touchLeft = this.touchRight = this.touchUp = this.touchDown = false;
    this.actionQueued = this.pauseQueued = false;
  }
}

export const input = new InputState();
