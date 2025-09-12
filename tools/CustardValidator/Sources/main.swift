import Foundation
import CustardKit

enum ValidateError: Error {
    case fileNotFound(String)
    case readFailed(String)
}

func validate(file path: String) throws {
    let url = URL(fileURLWithPath: path)
    guard FileManager.default.fileExists(atPath: url.path) else {
        throw ValidateError.fileNotFound(path)
    }
    let data: Data
    do { data = try Data(contentsOf: url) } catch { throw ValidateError.readFailed(path) }

    let decoder = JSONDecoder()
    decoder.allowsJSON5 = false
    decoder.dateDecodingStrategy = .deferredToDate

    // Try decode as a single Custard first, then as an array
    do {
        _ = try decoder.decode(Custard.self, from: data)
        print("OK: Custard")
        return
    } catch {
        // fallthrough to try array
    }
    do {
        _ = try decoder.decode([Custard].self, from: data)
        print("OK: [Custard]")
        return
    } catch {
        if let decErr = error as? DecodingError {
            switch decErr {
            case .typeMismatch(let t, let ctx):
                fputs("DecodingError.typeMismatch: \(t) at \(ctx.codingPath) — \(ctx.debugDescription)\n", stderr)
            case .keyNotFound(let k, let ctx):
                fputs("DecodingError.keyNotFound: \(k) at \(ctx.codingPath) — \(ctx.debugDescription)\n", stderr)
            case .valueNotFound(let t, let ctx):
                fputs("DecodingError.valueNotFound: \(t) at \(ctx.codingPath) — \(ctx.debugDescription)\n", stderr)
            case .dataCorrupted(let ctx):
                fputs("DecodingError.dataCorrupted at \(ctx.codingPath) — \(ctx.debugDescription)\n", stderr)
            @unknown default:
                fputs("DecodingError.unknown: \(error.localizedDescription)\n", stderr)
            }
        } else {
            fputs("ERROR: \(error.localizedDescription)\n", stderr)
        }
    }
    // Try decoding UserMade (used internally in AzooKey), in case the file is in that shape
    // This requires AzooKeyCore, which we don't depend on here. So we stop at Custard level.
    print("ERROR: Failed to decode as Custard or [Custard]")
    exit(1)
}

let args = CommandLine.arguments.dropFirst()
if args.isEmpty {
    fputs("Usage: custard-validate <file.json>\n", stderr)
    exit(2)
}

var exitCode: Int32 = 0
for p in args {
    do {
        try validate(file: p)
    } catch ValidateError.fileNotFound(let f) {
        fputs("ERROR: File not found: \(f)\n", stderr)
        exitCode = 1
    } catch ValidateError.readFailed(let f) {
        fputs("ERROR: Failed to read file: \(f)\n", stderr)
        exitCode = 1
    } catch {
        fputs("ERROR: \(error.localizedDescription)\n", stderr)
        exitCode = 1
    }
}
exit(exitCode)
