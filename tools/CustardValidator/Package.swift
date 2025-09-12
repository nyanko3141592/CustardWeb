// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "CustardValidator",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "custard-validate", targets: ["CustardValidator"])
    ],
    dependencies: [
        // Pin to the same revision AzooKey uses for compatibility
        .package(url: "https://github.com/azooKey/CustardKit", revision: "563635caf1213dd6b2baff63ed1b0cf254b9d78a")
    ],
    targets: [
        .executableTarget(
            name: "CustardValidator",
            dependencies: [
                .product(name: "CustardKit", package: "CustardKit")
            ],
            path: "Sources"
        )
    ]
)

