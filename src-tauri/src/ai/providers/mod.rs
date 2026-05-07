use std::sync::Arc;

use super::AIProvider;

pub mod dashscope;
pub mod grsai;
pub mod kie;
pub mod n1n;

pub use dashscope::DashScopeProvider;
pub use grsai::GrsaiProvider;
pub use kie::KieProvider;
pub use n1n::N1nProvider;

pub fn build_default_providers() -> Vec<Arc<dyn AIProvider>> {
    vec![
        Arc::new(GrsaiProvider::new()),
        Arc::new(KieProvider::new()),
        Arc::new(DashScopeProvider::new()),
        Arc::new(N1nProvider::new()),
    ]
}
