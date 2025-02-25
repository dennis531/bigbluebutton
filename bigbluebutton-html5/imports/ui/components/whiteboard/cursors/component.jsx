import * as React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import Cursor from './cursor/component';
import PositionLabel from './position-label/component';

const XS_OFFSET = 8;
const SMALL_OFFSET = 18;
const XL_OFFSET = 85;
const BOTTOM_CAM_HANDLE_HEIGHT = 10;
const PRES_TOOLBAR_HEIGHT = 35;

const baseName = Meteor.settings.public.app.cdn + Meteor.settings.public.app.basename;
const makeCursorUrl = (filename) => `${baseName}/resources/images/whiteboard-cursor/${filename}`;

const TOOL_CURSORS = {
  select: 'default',
  erase: 'none',
  arrow: 'none',
  draw: `url('${makeCursorUrl('pencil.png')}') 2 22, default`,
  rectangle: `url('${makeCursorUrl('square.png')}'), default`,
  ellipse: `url('${makeCursorUrl('ellipse.png')}'), default`,
  triangle: `url('${makeCursorUrl('triangle.png')}'), default`,
  line: `url('${makeCursorUrl('line.png')}'), default`,
  text: `url('${makeCursorUrl('text.png')}'), default`,
  sticky: `url('${makeCursorUrl('square.png')}'), default`,
  pan: 'grab',
  grabbing: 'grabbing',
  moving: 'move',
};
const Cursors = (props) => {
  const cursorWrapper = React.useRef();
  const [active, setActive] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const {
    whiteboardId,
    otherCursors,
    currentUser,
    currentPoint,
    tldrawCamera,
    publishCursorUpdate,
    children,
    isViewersCursorLocked,
    hasMultiUserAccess,
    isMultiUserActive,
    isPanning,
    isMoving,
    currentTool,
    disabledPan,
  } = props;

  const [panGrabbing, setPanGrabbing] = React.useState(false);

  const start = () => setActive(true);
  const handleGrabbing = () => setPanGrabbing(true);
  const handleReleaseGrab = () => setPanGrabbing(false);

  const multiUserAccess = hasMultiUserAccess(whiteboardId, currentUser?.userId);
  const end = () => {
    if (whiteboardId && (multiUserAccess || currentUser?.presenter)) {
      publishCursorUpdate({
        xPercent: -1.0,
        yPercent: -1.0,
        whiteboardId,
      });
    }
    setActive(false);
  };

  const moved = (event) => {
    const { type, x, y } = event;
    const nav = document.getElementById('Navbar');
    const getSibling = (el) => {
      if (el?.previousSibling && !el?.previousSibling?.hasAttribute('data-test')) {
        return el?.previousSibling;
      }
      return null;
    };
    const panel = getSibling(nav);
    const webcams = document.getElementById('cameraDock');
    const subPanel = panel && getSibling(panel);
    const camPosition = document.getElementById('layout')?.getAttribute('data-cam-position') || null;
    const sl = document.getElementById('layout')?.getAttribute('data-layout');
    const presentationContainer = document.querySelector('[data-test="presentationContainer"]');
    const presentation = document.getElementById('currentSlideText')?.parentElement;
    const banners = document.querySelectorAll('[data-test="notificationBannerBar"]');
    let yOffset = 0;
    let xOffset = 0;
    const calcPresOffset = () => {
      yOffset
        += (parseFloat(presentationContainer?.style?.height)
          - (parseFloat(presentation?.style?.height)
            + (currentUser.presenter ? PRES_TOOLBAR_HEIGHT : 0))
        ) / 2;
      xOffset
        += (parseFloat(presentationContainer?.style?.width)
          - parseFloat(presentation?.style?.width)
        ) / 2;
    };
    // If the presentation container is the full screen element we don't
    // need any offsets
    const { webkitFullscreenElement, fullscreenElement } = document;
    const fsEl = webkitFullscreenElement || fullscreenElement;
    if (fsEl?.getAttribute('data-test') === 'presentationContainer') {
      calcPresOffset();
      return setPos({ x: x - xOffset, y: y - yOffset });
    }
    if (nav) yOffset += parseFloat(nav?.style?.height);
    if (panel) xOffset += parseFloat(panel?.style?.width);
    if (subPanel) xOffset += parseFloat(subPanel?.style?.width);

    // offset native tldraw eraser animation container
    const overlay = document.getElementsByClassName('tl-overlay')[0];
    if (overlay) overlay.style.left = '0px';

    if (type === 'touchmove') {
      calcPresOffset();
      if (!active) {
        setActive(true);
      }
      const newX = event?.changedTouches[0]?.clientX - xOffset;
      const newY = event?.changedTouches[0]?.clientY - yOffset;
      return setPos({ x: newX, y: newY });
    }

    if (document?.documentElement?.dir === 'rtl') {
      xOffset = 0;
      if (presentationContainer && presentation) {
        calcPresOffset();
      }
      if (sl.includes('custom')) {
        if (webcams) {
          if (camPosition === 'contentTop' || !camPosition) {
            yOffset += (parseFloat(webcams?.style?.height || 0) + BOTTOM_CAM_HANDLE_HEIGHT);
          }
          if (camPosition === 'contentBottom') {
            yOffset -= BOTTOM_CAM_HANDLE_HEIGHT;
          }
          if (camPosition === 'contentRight') {
            xOffset += (parseFloat(webcams?.style?.width || 0) + SMALL_OFFSET);
          }
        }
      }
      if (sl?.includes('smart')) {
        if (panel || subPanel) {
          const dockPos = webcams?.getAttribute('data-position');
          if (dockPos === 'contentTop') {
            yOffset += (parseFloat(webcams?.style?.height || 0) + SMALL_OFFSET);
          }
        }
      }
      if (webcams && sl?.includes('videoFocus')) {
        xOffset += parseFloat(nav?.style?.width);
        yOffset += (parseFloat(panel?.style?.height || 0) - XL_OFFSET);
      }
    } else {
      if (sl.includes('custom')) {
        if (webcams) {
          if (camPosition === 'contentTop' || !camPosition) {
            yOffset += (parseFloat(webcams?.style?.height) || 0) + XS_OFFSET;
          }
          if (camPosition === 'contentBottom') {
            yOffset -= BOTTOM_CAM_HANDLE_HEIGHT;
          }
          if (camPosition === 'contentLeft') {
            xOffset += (parseFloat(webcams?.style?.width) || 0) + SMALL_OFFSET;
          }
        }
      }

      if (sl.includes('smart')) {
        if (panel || subPanel) {
          const dockPos = webcams?.getAttribute('data-position');
          if (dockPos === 'contentLeft') {
            xOffset += (parseFloat(webcams?.style?.width || 0) + SMALL_OFFSET);
          }
          if (dockPos === 'contentTop') {
            yOffset += (parseFloat(webcams?.style?.height || 0) + SMALL_OFFSET);
          }
        }
        if (!panel && !subPanel) {
          if (webcams) {
            xOffset = parseFloat(webcams?.style?.width || 0) + SMALL_OFFSET;
          }
        }
      }
      if (sl?.includes('videoFocus')) {
        if (webcams) {
          xOffset = parseFloat(subPanel?.style?.width);
          yOffset = parseFloat(panel?.style?.height);
        }
      }
      if (presentationContainer && presentation) {
        calcPresOffset();
      }
    }

    if (banners) {
      banners.forEach((el) => {
        yOffset += parseFloat(window.getComputedStyle(el).height);
      });
    }

    return setPos({ x: event.x - xOffset, y: event.y - yOffset });
  };

  React.useEffect(() => {
    const currentCursor = cursorWrapper?.current;
    currentCursor?.addEventListener('mouseenter', start);
    currentCursor?.addEventListener('mouseleave', end);
    currentCursor?.addEventListener('mousedown', handleGrabbing);
    currentCursor?.addEventListener('mouseup', handleReleaseGrab);
    currentCursor?.addEventListener('touchend', end);
    currentCursor?.addEventListener('mousemove', moved);
    currentCursor?.addEventListener('touchmove', moved);

    return () => {
      currentCursor?.removeEventListener('mouseenter', start);
      currentCursor?.removeEventListener('mouseleave', end);
      currentCursor?.removeEventListener('mousedown', handleGrabbing);
      currentCursor?.removeEventListener('mouseup', handleReleaseGrab);
      currentCursor?.removeEventListener('touchend', end);
      currentCursor?.removeEventListener('mousemove', moved);
      currentCursor?.removeEventListener('touchmove', moved);
    };
  }, [cursorWrapper, whiteboardId, currentUser.presenter]);

  let cursorType = multiUserAccess || currentUser?.presenter ? TOOL_CURSORS[currentTool] || 'none' : 'default';
  if (isPanning && !disabledPan) {
    if (panGrabbing) {
      cursorType = TOOL_CURSORS.grabbing;
    } else {
      cursorType = TOOL_CURSORS.pan;
    }
  }
  if (isMoving) cursorType = TOOL_CURSORS.moving;

  return (
    <span key={`cursor-wrapper-${whiteboardId}`} ref={cursorWrapper}>
      <div style={{ height: '100%', cursor: cursorType }}>
        {((active && multiUserAccess) || (active && currentUser?.presenter)) && (
          <PositionLabel
            pos={pos}
            otherCursors={otherCursors}
            currentUser={currentUser}
            currentPoint={currentPoint}
            tldrawCamera={tldrawCamera}
            publishCursorUpdate={publishCursorUpdate}
            whiteboardId={whiteboardId}
            isMultiUserActive={isMultiUserActive}
          />
        )}
        {children}
      </div>
      {otherCursors
        .filter((c) => c?.xPercent && c.xPercent !== -1.0 && c?.yPercent && c.yPercent !== -1.0)
        .filter((c) => {
          if ((isViewersCursorLocked && c?.role !== 'VIEWER')
            || !isViewersCursorLocked
            || currentUser?.presenter
          ) {
            return c;
          }
          return null;
        })
        .map((c) => {
          if (c && currentUser.userId !== c?.userId) {
            if (c.presenter) {
              return (
                <Cursor
                  key={`${c?.userId}`}
                  name={c?.userName}
                  color="#C70039"
                  x={c?.xPercent}
                  y={c?.yPercent}
                  tldrawCamera={tldrawCamera}
                  isMultiUserActive={isMultiUserActive(whiteboardId)}
                  owner
                />
              );
            }

            return hasMultiUserAccess(whiteboardId, c?.userId)
              && (
                <Cursor
                  key={`${c?.userId}`}
                  name={c?.userName}
                  color="#AFE1AF"
                  x={c?.xPercent}
                  y={c?.yPercent}
                  tldrawCamera={tldrawCamera}
                  isMultiUserActive={isMultiUserActive(whiteboardId)}
                  owner
                />
              );
          }
          return null;
        })}
    </span>
  );
};

Cursors.propTypes = {
  whiteboardId: PropTypes.string,
  otherCursors: PropTypes.arrayOf(PropTypes.shape).isRequired,
  currentUser: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    presenter: PropTypes.bool.isRequired,
  }).isRequired,
  currentPoint: PropTypes.arrayOf(PropTypes.number),
  tldrawCamera: PropTypes.shape({
    point: PropTypes.arrayOf(PropTypes.number).isRequired,
    zoom: PropTypes.number.isRequired,
  }),
  publishCursorUpdate: PropTypes.func.isRequired,
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
  isViewersCursorLocked: PropTypes.bool.isRequired,
  hasMultiUserAccess: PropTypes.func.isRequired,
  isMultiUserActive: PropTypes.func.isRequired,
  isPanning: PropTypes.bool.isRequired,
  isMoving: PropTypes.bool.isRequired,
  currentTool: PropTypes.string,
  disabledPan: PropTypes.bool.isRequired,
};

Cursors.defaultProps = {
  whiteboardId: undefined,
  currentPoint: undefined,
  tldrawCamera: undefined,
  currentTool: null,
};

export default Cursors;
