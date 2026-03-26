import Foundation
import UIKit
import ARKit
import SceneKit
import React

@objc(ARHeightCheck)
class ARHeightCheck: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(present:rejecter:)
  func present(_ resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard ARWorldTrackingConfiguration.isSupported else {
        reject("not_supported", "ARWorldTrackingConfiguration is not supported on this device.", nil)
        return
      }

      guard let rootVC = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .flatMap({ $0.windows })
        .first(where: { $0.isKeyWindow })?.rootViewController else {
        reject("no_root_vc", "Could not find root view controller.", nil)
        return
      }

      let vc = ARHeightCheckViewController()
      vc.modalPresentationStyle = .fullScreen
      vc.onComplete = { payload in
        resolve(payload)
      }
      vc.onCancel = {
        resolve([
          "confirmed": false,
          "heightMeters": 0
        ])
      }

      rootVC.present(vc, animated: true)
    }
  }
}

final class ARHeightCheckViewController: UIViewController, ARSCNViewDelegate, ARSessionDelegate {
  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?

  private let sceneView = ARSCNView(frame: .zero)
  private let overlay = UIView()
  private let titleLabel = UILabel()
  private let valueLabel = UILabel()
  private let statusLabel = UILabel()
  private let continueButton = UIButton(type: .system)
  private let cancelButton = UIButton(type: .system)

  private let targetHeight: Float = 1.22
  private let minHeight: Float = 1.17
  private let maxHeight: Float = 1.27

  private var floorY: Float?
  private var bestFallbackFloorY: Float?
  private var latestHeight: Float = 0
  private var stableGoodFrames: Int = 0

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black

    sceneView.frame = view.bounds
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    sceneView.delegate = self
    sceneView.session.delegate = self
    sceneView.automaticallyUpdatesLighting = true
    view.addSubview(sceneView)

    overlay.frame = view.bounds
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.backgroundColor = UIColor.black.withAlphaComponent(0.18)
    view.addSubview(overlay)

    configureUI()
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)

    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal]
    if #available(iOS 13.0, *) {
      configuration.environmentTexturing = .automatic
    }

    sceneView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    sceneView.session.pause()
  }

  private func configureUI() {
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    titleLabel.text = "Set phone height to 4' off the ground"
    titleLabel.textColor = .white
    titleLabel.font = .systemFont(ofSize: 24, weight: .bold)
    titleLabel.textAlignment = .center
    titleLabel.numberOfLines = 0

    valueLabel.translatesAutoresizingMaskIntoConstraints = false
    valueLabel.text = "Searching for floor…"
    valueLabel.textColor = .white
    valueLabel.font = .monospacedDigitSystemFont(ofSize: 28, weight: .semibold)
    valueLabel.textAlignment = .center

    statusLabel.translatesAutoresizingMaskIntoConstraints = false
    statusLabel.text = "Point the camera toward the floor."
    statusLabel.textColor = .white
    statusLabel.font = .systemFont(ofSize: 18, weight: .medium)
    statusLabel.textAlignment = .center
    statusLabel.numberOfLines = 0

    continueButton.translatesAutoresizingMaskIntoConstraints = false
    continueButton.setTitle("Continue", for: .normal)
    continueButton.setTitleColor(.black, for: .normal)
    continueButton.backgroundColor = UIColor.white
    continueButton.layer.cornerRadius = 14
    continueButton.titleLabel?.font = .systemFont(ofSize: 18, weight: .bold)
    continueButton.isEnabled = false
    continueButton.alpha = 0.5
    continueButton.addTarget(self, action: #selector(handleContinue), for: .touchUpInside)

    cancelButton.translatesAutoresizingMaskIntoConstraints = false
    cancelButton.setTitle("Back", for: .normal)
    cancelButton.setTitleColor(.white, for: .normal)
    cancelButton.backgroundColor = UIColor.black.withAlphaComponent(0.35)
    cancelButton.layer.cornerRadius = 12
    cancelButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .semibold)
    cancelButton.addTarget(self, action: #selector(handleCancel), for: .touchUpInside)

    overlay.addSubview(titleLabel)
    overlay.addSubview(valueLabel)
    overlay.addSubview(statusLabel)
    overlay.addSubview(continueButton)
    overlay.addSubview(cancelButton)

    NSLayoutConstraint.activate([
      cancelButton.topAnchor.constraint(equalTo: overlay.safeAreaLayoutGuide.topAnchor, constant: 16),
      cancelButton.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 16),
      cancelButton.widthAnchor.constraint(equalToConstant: 80),
      cancelButton.heightAnchor.constraint(equalToConstant: 40),

      titleLabel.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
      titleLabel.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -110),
      titleLabel.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 24),
      titleLabel.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -24),

      valueLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 22),
      valueLabel.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),

      statusLabel.topAnchor.constraint(equalTo: valueLabel.bottomAnchor, constant: 18),
      statusLabel.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 24),
      statusLabel.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -24),

      continueButton.leadingAnchor.constraint(equalTo: overlay.leadingAnchor, constant: 24),
      continueButton.trailingAnchor.constraint(equalTo: overlay.trailingAnchor, constant: -24),
      continueButton.bottomAnchor.constraint(equalTo: overlay.safeAreaLayoutGuide.bottomAnchor, constant: -24),
      continueButton.heightAnchor.constraint(equalToConstant: 56)
    ])
  }

  @objc private func handleContinue() {
    dismiss(animated: true) {
      self.onComplete?([
        "confirmed": true,
        "heightMeters": self.latestHeight
      ])
    }
  }

  @objc private func handleCancel() {
    dismiss(animated: true) {
      self.onCancel?()
    }
  }

  func renderer(_ renderer: SCNSceneRenderer, didAdd node: SCNNode, for anchor: ARAnchor) {
    updateFloorEstimate(from: anchor)
  }

  func renderer(_ renderer: SCNSceneRenderer, didUpdate node: SCNNode, for anchor: ARAnchor) {
    updateFloorEstimate(from: anchor)
  }

  private func updateFloorEstimate(from anchor: ARAnchor) {
    guard let plane = anchor as? ARPlaneAnchor else { return }

    let y = plane.transform.columns.3.y

    if #available(iOS 12.0, *), plane.classification == .floor {
      floorY = y
      return
    }

    let area = plane.extent.x * plane.extent.z
    if area > 0.5 {
      if let current = bestFallbackFloorY {
        bestFallbackFloorY = min(current, y)
      } else {
        bestFallbackFloorY = y
      }
    }
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    let cameraY = frame.camera.transform.columns.3.y
    let resolvedFloorY = floorY ?? bestFallbackFloorY

    guard let floor = resolvedFloorY else {
      DispatchQueue.main.async {
        self.valueLabel.text = "Searching for floor…"
        self.statusLabel.text = "Point the camera toward the floor."
        self.statusLabel.textColor = .white
        self.continueButton.isEnabled = false
        self.continueButton.alpha = 0.5
      }
      return
    }

    let height = abs(cameraY - floor)
    latestHeight = height

    let feet = height * 3.28084
    let text = String(format: "%.2f m • %.1f ft", height, feet)

    let isGood = height >= minHeight && height <= maxHeight
    let isClose = height >= (minHeight - 0.08) && height <= (maxHeight + 0.08)

    if isGood {
      stableGoodFrames += 1
    } else {
      stableGoodFrames = 0
    }

    DispatchQueue.main.async {
      self.valueLabel.text = text

      if isGood {
        self.statusLabel.text = "Good height"
        self.statusLabel.textColor = .systemGreen
      } else if isClose {
        self.statusLabel.text = "Close"
        self.statusLabel.textColor = .systemYellow
      } else if height < self.minHeight {
        self.statusLabel.text = "Too low"
        self.statusLabel.textColor = .systemRed
      } else {
        self.statusLabel.text = "Too high"
        self.statusLabel.textColor = .systemRed
      }

      let enable = self.stableGoodFrames >= 10
      self.continueButton.isEnabled = enable
      self.continueButton.alpha = enable ? 1.0 : 0.5
    }
  }
}
