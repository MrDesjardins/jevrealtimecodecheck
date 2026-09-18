---
applies_to: **/*.go
---

# Errors must be checked, not discarded
A returned `error` value must be checked; do not assign it to `_` and ignore it.

Good:
```go
if err := save(record); err != nil {
    return err
}
```

Bad:
```go
_ = save(record)
```

# Use gofmt-consistent formatting
Code must be formatted with `gofmt`/`goimports`; do not hand-format against the standard style.

Good:
```go
func Add(a, b int) int {
	return a + b
}
```

Bad:
```go
func Add(a,b int)int{
return a+b
}
```

# Exported identifiers must have doc comments
Every exported function, type, and constant should have a doc comment starting with its name.

Good:
```go
// ParseRules parses a Markdown rules file into Rule values.
func ParseRules(md string) []Rule { ... }
```

Bad:
```go
func ParseRules(md string) []Rule { ... }
```

# Avoid naked returns in longer functions
A function longer than a few lines should not use a naked `return`; name the return values explicitly at the call site for clarity.

Good:
```go
func divide(a, b int) (result int, err error) {
	if b == 0 {
		return 0, errors.New("divide by zero")
	}
	return a / b, nil
}
```

Bad:
```go
func divide(a, b int) (result int, err error) {
	if b == 0 {
		err = errors.New("divide by zero")
		return
	}
	result = a / b
	return
}
```

# Do not use panic for expected error conditions
`panic` should be reserved for truly unrecoverable programmer errors, not expected/handleable error conditions.

Good:
```go
if !found {
	return nil, ErrNotFound
}
```

Bad:
```go
if !found {
	panic("not found")
}
```

# Prefer errors.Is/errors.As over string comparisons
Check error identity/type with `errors.Is`/`errors.As`, not by comparing `err.Error()` strings.

Good:
```go
if errors.Is(err, ErrNotFound) { ... }
```

Bad:
```go
if strings.Contains(err.Error(), "not found") { ... }
```

# Avoid global mutable state
Package-level mutable variables should be avoided in favor of state passed explicitly through structs/parameters.

Good:
```go
type Store struct{ items []Item }
func NewStore() *Store { return &Store{} }
```

Bad:
```go
var items []Item
```

# Keep interfaces small and consumer-defined
Interfaces should be small and defined by the package that consumes them, not the package that implements them.

Good:
```go
type UserFetcher interface { GetUser(id string) (*User, error) }
```

Bad:
```go
type Repository interface { GetUser(id string) (*User, error); SaveUser(*User) error; DeleteUser(string) error; ListOrders() ([]Order, error) }
```

# Do not ignore context cancellation
A function taking a `context.Context` must respect cancellation/deadline, not ignore `ctx.Done()`.

Good:
```go
select {
case <-ctx.Done():
	return ctx.Err()
case result := <-resultCh:
	return result
}
```

Bad:
```go
result := <-resultCh
return result
```

# Use defer for cleanup immediately after acquiring a resource
Call `defer resource.Close()` (or equivalent) right after successfully acquiring the resource, not later in the function.

Good:
```go
f, err := os.Open(path)
if err != nil {
	return err
}
defer f.Close()
```

Bad:
```go
f, err := os.Open(path)
if err != nil {
	return err
}
// ... 40 lines later ...
f.Close()
```

# Avoid goroutine leaks
Every goroutine started must have a clear path to termination; do not launch goroutines that can block forever.

Good:
```go
go func() {
	defer close(done)
	worker(ctx)
}()
```

Bad:
```go
go func() {
	worker() // blocks forever if input never arrives
}()
```

# Do not overuse init() for complex logic
`init()` functions should be limited to simple registration; complex setup belongs in an explicit constructor.

Good:
```go
func NewClient(cfg Config) *Client { return &Client{cfg: cfg} }
```

Bad:
```go
func init() {
	globalClient = buildComplexClient()
}
```

# Document exported struct fields
Exported struct fields intended for external use should have a comment when their purpose isn't obvious from the name.

Good:
```go
type Config struct {
	// MaxRetries is the number of retry attempts before giving up.
	MaxRetries int
}
```

Bad:
```go
type Config struct {
	MaxRetries int
}
```

# Avoid deeply nested error handling
Prefer early returns on error over deeply nested `if err != nil { ... }` blocks.

Good:
```go
data, err := read(path)
if err != nil {
	return err
}
return process(data)
```

Bad:
```go
if data, err := read(path); err == nil {
	if parsed, err := parse(data); err == nil {
		return process(parsed)
	}
}
```

# Avoid interface{}/any when a concrete type is known
Do not use `any`/`interface{}` for a value whose type is actually known at the call site.

Good:
```go
func SetName(name string) { ... }
```

Bad:
```go
func SetName(name interface{}) { ... }
```

# Prefer composition over embedding when behavior differs
Use composition (a field of the type) instead of struct embedding when you need different behavior than the embedded type provides.

Good:
```go
type Cache struct { store Store }
```

Bad:
```go
type Cache struct { Store } // overrides half the methods anyway
```

# Use consistent receiver names
All methods on a type should use the same receiver variable name, per Go convention.

Good:
```go
func (c *Cache) Get(k string) (string, bool) { ... }
func (c *Cache) Set(k, v string) { ... }
```

Bad:
```go
func (c *Cache) Get(k string) (string, bool) { ... }
func (cache *Cache) Set(k, v string) { ... }
```

# Avoid copying a struct containing a mutex
A struct embedding `sync.Mutex` must be used by pointer; copying it copies the lock state, which is a bug.

Good:
```go
func (c *Counter) Inc() { c.mu.Lock(); defer c.mu.Unlock(); c.n++ }
```

Bad:
```go
func (c Counter) Inc() { c.mu.Lock(); defer c.mu.Unlock(); c.n++ }
```

# Do not both log and return the same error
An error should either be logged where it's handled, or returned to the caller — not both, which causes duplicate log noise.

Good:
```go
if err != nil {
	return fmt.Errorf("save record: %w", err)
}
```

Bad:
```go
if err != nil {
	log.Println(err)
	return err
}
```

# Define a clear channel ownership model
For any channel, exactly one goroutine should be responsible for closing it; document who owns close().

Good:
```go
// producer owns and closes resultCh
func produce(resultCh chan<- int) { defer close(resultCh); ... }
```

Bad:
```go
// both producer and consumer sometimes close resultCh
```

# Avoid unbounded goroutine spawning
Do not spawn a goroutine per item of an unbounded input without a worker pool or concurrency limit.

Good:
```go
sem := make(chan struct{}, 10)
for _, item := range items {
	sem <- struct{}{}
	go func(i Item) { defer func() { <-sem }(); process(i) }(item)
}
```

Bad:
```go
for _, item := range items {
	go process(item)
}
```

# Pass context.Context as the first parameter
Functions supporting cancellation/timeouts should take `ctx context.Context` as their first parameter, per Go convention.

Good:
```go
func FetchUser(ctx context.Context, id string) (*User, error) { ... }
```

Bad:
```go
func FetchUser(id string, ctx context.Context) (*User, error) { ... }
```

# Avoid reflection when a simpler approach exists
Do not reach for the `reflect` package when normal typed code would solve the problem more simply and safely.

Good:
```go
func Sum(nums []int) int { ... }
```

Bad:
```go
func Sum(v interface{}) int {
	rv := reflect.ValueOf(v)
	...
}
```

# Prefer table-driven tests
Related test cases with the same shape should use a table-driven test, not repetitive near-identical test functions.

Good:
```go
cases := []struct{ in string; want int }{{"1", 1}, {"abc", 0}}
for _, c := range cases { ... }
```

Bad:
```go
func TestParseOne(t *testing.T) { ... }
func TestParseTwo(t *testing.T) { ... }
func TestParseThree(t *testing.T) { ... }
```

# Avoid exported package-level mutable variables
A package should not export a mutable `var` as its primary way of sharing state with callers.

Good:
```go
func GetConfig() Config { return currentConfig() }
```

Bad:
```go
var Config = defaultConfig()
```

# Use meaningful package names
Package names should describe their contents (e.g. `ruleparser`), not be generic like `util` or `common`.

Good:
```go
package ruleparser
```

Bad:
```go
package util
```

# Do not shadow the built-in error type name
Do not name a local variable or type `error`, shadowing the built-in `error` type.

Good:
```go
var lastErr error
```

Bad:
```go
var error error
```

# Avoid excessive empty interfaces in public APIs
A public function signature should avoid `interface{}`/`any` parameters when a concrete or generic type would work.

Good:
```go
func Process[T Item](items []T) { ... }
```

Bad:
```go
func Process(items []interface{}) { ... }
```

# Use named fields for struct literals with many fields
A struct literal with more than a couple of fields should use named-field syntax, not positional, for clarity and refactor safety.

Good:
```go
user := User{ID: 1, Name: "Ada", Email: "ada@example.com", Role: "admin"}
```

Bad:
```go
user := User{1, "Ada", "ada@example.com", "admin"}
```

# Check the ok value from map lookups when presence matters
When distinguishing 'key absent' from 'zero value', use the two-value map lookup form (`v, ok := m[k]`) and check `ok`.

Good:
```go
if v, ok := cache[key]; ok {
	return v
}
```

Bad:
```go
v := cache[key]
return v
```

# Pre-1.22 loop variables are reused across iterations
In Go versions before 1.22, a `for` loop's variable is a single variable reused every iteration; capturing it by reference in a goroutine or closure can observe the wrong (final) value unless explicitly copied.

Good:
```go
for _, item := range items {
	item := item // per-iteration copy, needed before Go 1.22
	go process(item)
}
```

Bad:
```go
for _, item := range items {
	go process(item) // pre-1.22: every goroutine may see the same, final item
}
```

# A nil map can be read but panics on write
Reading from a nil map returns the zero value with no error, but writing to a nil map panics — the two operations behave very differently for the same uninitialized value.

Good:
```go
m := make(map[string]int)
m["key"] = 1 // safe
```

Bad:
```go
var m map[string]int
m["key"] = 1 // panics: assignment to entry in nil map
```

# Appending to a slice can silently share the underlying array
Slicing an existing array/slice shares the same underlying storage; appending within capacity mutates data another slice still references, producing surprising aliasing bugs.

Good:
```go
b := make([]int, len(a))
copy(b, a)
b = append(b, 1) // b has its own backing array
```

Bad:
```go
b := a[:2]
b = append(b, 99) // may overwrite a[2] if b still has spare capacity in a's array
```

# defer runs at function return, not at the end of a loop iteration
`defer` inside a loop schedules every deferred call to run when the enclosing FUNCTION returns, not at the end of each iteration — resources pile up instead of being released promptly.

Good:
```go
for _, path := range paths {
	processFile(path) // opens and defers Close() inside its own function scope
}
```

Bad:
```go
for _, path := range paths {
	f, _ := os.Open(path)
	defer f.Close() // all files stay open until the outer function returns
```

# Struct comparison with == requires every field to be comparable
Two structs can be compared with `==` only if all their fields are comparable (no slices, maps, or functions); otherwise it's a compile error, and even when it compiles, struct equality is field-by-field, not semantic.

Good:
```go
type Point struct{ X, Y int }
if p1 == p2 { ... } // fine: both fields are comparable
```

Bad:
```go
type Config struct{ Tags []string }
if c1 == c2 { ... } // compile error: slice is not comparable
```

# recover only works when called directly inside a deferred function
`recover()` only stops a panic when it is called directly from within a `defer`red function on the panicking goroutine; calling it indirectly (from a function the defer calls) has no effect.

Good:
```go
defer func() {
	if r := recover(); r != nil {
		log.Println("recovered:", r)
	}
}()
```

Bad:
```go
defer handleRecover() // recover() inside handleRecover does NOT catch the panic
func handleRecover() { recover() }
```

# Avoid building SQL with string concatenation
Concatenating user input directly into a SQL query string enables SQL injection; use parameterized placeholders (`?` or `$1`) via the `database/sql` package.

Good:
```go
row := db.QueryRow("SELECT * FROM users WHERE email = ?", email)
```

Bad:
```go
row := db.QueryRow("SELECT * FROM users WHERE email = '" + email + "'")
```

# Avoid disabling TLS certificate verification
Setting `InsecureSkipVerify: true` on a `tls.Config` disables certificate validation entirely, making the connection vulnerable to man-in-the-middle attacks; it should never ship in production code.

Good:
```go
client := &http.Client{} // default transport verifies certificates
```

Bad:
```go
client := &http.Client{
	Transport: &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	},
}
```

# Validate file paths built from user input
A file path built by joining a base directory with user-supplied input must be checked (e.g. with `filepath.Clean` plus a prefix check) to prevent path traversal via `../` segments.

Good:
```go
clean := filepath.Join(baseDir, filepath.Clean("/"+userFile))
if !strings.HasPrefix(clean, baseDir) {
	return errors.New("invalid path")
}
```

Bad:
```go
path := filepath.Join(baseDir, userFile) // "../../etc/passwd" escapes baseDir unchecked
```

# Preallocate slices with a known capacity
Appending to a slice with no initial capacity forces repeated reallocation and copying as it grows; when the final size is known or estimable, preallocate with `make([]T, 0, n)`.

Good:
```go
results := make([]Item, 0, len(input))
for _, x := range input {
	results = append(results, transform(x))
}
```

Bad:
```go
var results []Item
for _, x := range input {
	results = append(results, transform(x)) // repeated reallocation as it grows
}
```

# Use strings.Builder instead of + for concatenation in loops
Concatenating strings with `+` inside a loop allocates a new string on every iteration; `strings.Builder` (or `bytes.Buffer`) accumulates without the repeated copying.

Good:
```go
var b strings.Builder
for _, s := range parts {
	b.WriteString(s)
}
result := b.String()
```

Bad:
```go
result := ""
for _, s := range parts {
	result += s // reallocates and copies the whole string every iteration
}
```

# Prefer buffered I/O for repeated small writes
Writing to a file or network connection in many small unbuffered calls incurs a syscall per write; wrap the writer in `bufio.Writer` and flush once at the end.

Good:
```go
w := bufio.NewWriter(file)
defer w.Flush()
for _, line := range lines {
	w.WriteString(line)
}
```

Bad:
```go
for _, line := range lines {
	file.WriteString(line) // one syscall per line
}
```
