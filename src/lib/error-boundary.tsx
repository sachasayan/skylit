import { Component, type ReactNode } from "react";
import { Button } from "../components/ui/button";

/** Contain a failed feature without unmounting its root or neighbouring features. */
export class FeatureBoundary extends Component<
  { children: ReactNode; revision?: unknown },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(
    previous: Readonly<{ children: ReactNode; revision?: unknown }>,
  ) {
    if (this.state.failed && previous.revision !== this.props.revision)
      this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="notice error">
        <p>This view could not be displayed.</p>
        <Button
          variant="secondary"
          onClick={() => this.setState({ failed: false })}
        >
          Try again
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
