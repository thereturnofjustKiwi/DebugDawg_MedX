import cv2
import numpy as np
import torch
from typing import Optional, Tuple


class GradCAMExtractor:
    """
    Grad-CAM for EfficientNet-B0.
    Hooks onto model.features[-1] (last Conv block).
    Written once — works for all 5 disease models.
    """

    def __init__(self, model: torch.nn.Module, device: torch.device):
        self.model = model
        self.device = device
        self._activations: Optional[torch.Tensor] = None
        self._gradients: Optional[torch.Tensor] = None
        self._handles = []
        self._register_hooks()

    def _register_hooks(self):
        target = self.model.features[-1]

        def fwd(module, inp, out):
            self._activations = out.detach()

        def bwd(module, grad_in, grad_out):
            self._gradients = grad_out[0].detach()

        self._handles.append(target.register_forward_hook(fwd))
        self._handles.append(target.register_full_backward_hook(bwd))

    def generate(
        self,
        input_tensor: torch.Tensor,
        class_idx: int,
        out_size: Tuple[int, int] = (224, 224),
    ) -> np.ndarray:
        """Returns normalized CAM [0, 1] resized to out_size (H, W)."""
        self.model.eval()
        inp = input_tensor.clone().to(self.device).requires_grad_(True)

        output = self.model(inp)
        self.model.zero_grad()

        one_hot = torch.zeros_like(output)
        one_hot[0, class_idx] = 1.0
        output.backward(gradient=one_hot)

        if self._gradients is None or self._activations is None:
            return np.zeros(out_size)

        # GAP over spatial dims → channel weights
        weights = self._gradients.mean(dim=[0, 2, 3])      # (C,)
        activations = self._activations[0].clone()          # (C, H', W')

        for i, w in enumerate(weights):
            activations[i] *= w

        cam = activations.mean(dim=0).cpu().numpy()         # (H', W')
        cam = np.maximum(cam, 0)

        if cam.max() > 0:
            cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        return cv2.resize(cam, (out_size[1], out_size[0]))

    def get_region(self, cam: np.ndarray) -> str:
        """Identify dominant activation region from CAM."""
        H, W = cam.shape
        mask = cam > 0.5
        if not mask.any():
            mask = cam > cam.mean()
        y_c, x_c = np.where(mask)
        if len(y_c) == 0:
            return "Diffuse"
        cy, cx = y_c.mean() / H, x_c.mean() / W
        vert = "Upper" if cy < 0.4 else ("Lower" if cy > 0.6 else "Middle")
        horiz = "Left" if cx < 0.5 else "Right"
        return f"{vert} {horiz}"

    def to_overlay(self, cam: np.ndarray, original_rgb: np.ndarray) -> np.ndarray:
        """Blend jet-colorized CAM onto original RGB (H, W, 3)."""
        heatmap = cv2.applyColorMap((cam * 255).astype(np.uint8), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        return cv2.addWeighted(original_rgb, 0.55, heatmap_rgb, 0.45, 0)

    def remove_hooks(self):
        for h in self._handles:
            h.remove()
