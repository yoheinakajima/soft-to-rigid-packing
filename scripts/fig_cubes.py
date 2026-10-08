"""Render cube packings: Friedman-style grey picture and paper figures."""
import json, sys, math, numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

G = np.array([[a, b, c] for a in (1, -1) for b in (1, -1) for c in (1, -1)], float) * 0.5
FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]

def quat_R(q):
    w, x, y, z = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-w*z), 2*(x*z+w*y)], [2*(x*y+w*z), 1-2*(x*x+z*z), 2*(y*z-w*x)], [2*(x*z-w*y), 2*(y*z+w*x), 1-2*(x*x+y*y)]])

def draw(ax, C, R, side, light=np.array([0.4, -0.5, 0.75]), color=None, tilt_colors=False, box=True, elev=22, azim=-58):
    light = light / np.linalg.norm(light)
    polys, cols = [], []
    for i in range(len(C)):
        V = C[i] + G @ np.asarray(R[i]).T
        tilt = max(math.degrees(math.acos(min(1, np.abs(np.asarray(R[i])[:, k]).max()))) for k in range(3))
        base = np.array(color if color is not None else ((0.70, 0.30, 0.42) if (tilt_colors and tilt > 1.5) else (0.19, 0.37, 0.55) if tilt_colors else (0.86, 0.86, 0.86)))
        for f in FACES:
            P = V[f]; nrm = np.cross(P[1]-P[0], P[2]-P[0]); nrm /= np.linalg.norm(nrm)
            if np.dot(nrm, P.mean(0) - C[i]) < 0: nrm = -nrm
            shade = 0.45 + 0.55 * max(0, np.dot(nrm, light))
            polys.append(P); cols.append(tuple(np.clip(base * shade, 0, 1)))
    pc = Poly3DCollection(polys, facecolors=cols, edgecolors='black', linewidths=0.6)
    ax.add_collection3d(pc)
    if box:
        for a in (0, side):
            for b in (0, side):
                ax.plot([0, side], [a, a], [b, b], color='0.35', lw=0.6); ax.plot([a, a], [0, side], [b, b], color='0.35', lw=0.6); ax.plot([a, a], [b, b], [0, side], color='0.35', lw=0.6)
    ax.set_xlim(0, side); ax.set_ylim(0, side); ax.set_zlim(0, side); ax.set_box_aspect((1, 1, 1))
    ax.view_init(elev=elev, azim=azim); ax.set_proj_type('ortho'); ax.set_axis_off()

if __name__ == '__main__':
    d = json.load(open(sys.argv[1])); out = sys.argv[2]
    C = np.array(d['C']); R = [np.array(r) for r in d['R']]; side = d['side']
    # Friedman-style: grey, no box, no text, white background
    fig = plt.figure(figsize=(3, 3), dpi=100); ax = fig.add_subplot(projection='3d', computed_zorder=True)
    draw(ax, C, R, side, box=False); plt.subplots_adjust(0, 0, 1, 1); fig.savefig(out + '_friedman.png', facecolor='white'); plt.close(fig)
    # paper figure: three views, tilted cubes coloured
    fig = plt.figure(figsize=(9, 3.2), dpi=200)
    for k, (el, az) in enumerate([(22, -58), (90, -90), (0, -90)]):
        ax = fig.add_subplot(1, 3, k + 1, projection='3d', computed_zorder=True); draw(ax, C, R, side, tilt_colors=True, elev=el, azim=az)
        ax.set_title(['perspective', 'top', 'front'][k], fontsize=9)
    plt.subplots_adjust(0, 0, 1, 0.92, wspace=0); fig.savefig(out + '_views.pdf'); fig.savefig(out + '_views.png'); plt.close(fig)
    print('wrote', out + '_friedman.png', out + '_views.pdf')
