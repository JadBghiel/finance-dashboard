import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose }) => {
  const handleDownload = (type: 'csv' | 'sql' | 'pdf') => {
    window.open(`${API_BASE}/export/${type}`, '_blank');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>export your data</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          pick a format to download your finance data
        </Typography>
        <Stack spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            onClick={() => handleDownload('csv')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            csv - spreadsheet format
          </Button>
          <Button
            variant="outlined"
            startIcon={<StorageIcon />}
            onClick={() => handleDownload('sql')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            sql/db - raw sqlite database
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleDownload('pdf')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            pdf - summary report
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
